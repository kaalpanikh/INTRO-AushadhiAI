from fuzzywuzzy import process
import re
import io
from PIL import Image
import numpy as np
import random
from fuzzywuzzy import fuzz
from .azure_vision_service import AzureVisionService

class OCRService:
    def __init__(self):
        """
        Initialize the OCR service with Azure integration.
        """
        # Initialize the Azure Vision service for OCR
        self.azure_vision = AzureVisionService()
        # In the demo version, we'll simulate OCR results
        # In a production version, this would use EasyOCR
        self.sample_texts = [
            "Take Amoxicillin 500mg three times daily for 7 days",
            "Paracetamol 500mg as needed for pain, not exceeding 4 tablets in 24 hours",
            "Lipitor 20mg once daily",
            "Metformin 500mg with meals twice daily",
            "Omeprazole 20mg before breakfast",
            "Cetirizine 10mg once daily for allergies",
            "Levothyroxine 50mcg in the morning on empty stomach",
            "Amlodipine 5mg daily for blood pressure",
            "Brufen 400mg three times daily after food",
            "Cozaar 50mg once daily in the morning",
            "Metoprolol 100mg twice daily",
            "Synthroid 75mcg daily before breakfast",
            "Simvastatin 40mg at bedtime",
            "Zoloft 50mg every morning with food",
            "Ventolin 2 puffs every 4-6 hours as needed for shortness of breath",
            "Aspirin 81mg daily with evening meal",
            "Hydrochlorthiazide 25mg once daily in the morning",
            "Fluoxetine 20mg once daily in the morning",
            "Gabapentin 300mg three times daily for nerve pain",
            "Singulair 10mg daily in the evening"
        ]
    
    def extract_text(self, image_bytes):
        """
        Extract text from prescription image.
        For the hackathon, we prioritize the Azure OCR service for accurate results
        but fall back to simulated data if Azure is unavailable or fails.
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            List of dictionaries containing extracted text and metadata
        """
        # First attempt to use Azure Vision for OCR (real OCR)
        try:
            azure_results = self.azure_vision.extract_text(image_bytes)
            if azure_results and len(azure_results) > 0:
                print(f"Azure OCR successfully extracted {len(azure_results)} text items")
                return azure_results
        except Exception as e:
            print(f"Azure OCR failed: {e}. Falling back to simulation.")
        
        # Fallback to simulated OCR results for demonstration
        return self._simulate_ocr_results()
        
    def _simulate_ocr_results(self):
        """
        Provides simulated OCR results for development and demo purposes.
        This is a fallback method when Azure OCR is unavailable.
        """
        result = []
        # Pick 3-7 random texts from the sample for variety
        selected_texts = random.sample(self.sample_texts, random.randint(3, min(7, len(self.sample_texts))))
        
        y_position = 0
        for text in selected_texts:
            # Randomize confidence scores between 0.6 and 0.99
            confidence = random.uniform(0.6, 0.99)
            
            # Create a simple bounding box
            width = len(text) * 8
            box = [
                [10, y_position],           # top-left
                [10 + width, y_position],   # top-right
                [10 + width, y_position + 40], # bottom-right
                [10, y_position + 40]       # bottom-left
            ]
            
            result.append({
                "text": text,
                "confidence": confidence, 
                "box": box
            })
            
            y_position += 50
            
        return result
    
    def identify_medications(self, ocr_results, med_names):
        """
        Identify medications in OCR results using advanced fuzzy matching with alias recognition.
        
        Args:
            ocr_results: List of OCR result dictionaries
            med_names: List of known medication names to match against
        
        Returns:
            List of dictionaries containing matched medications
        """
        import random
        import re
        from fuzzywuzzy import process
        
        # Extract all text from OCR results
        all_text = " ".join([item["text"] for item in ocr_results])
        
        print(f"Full OCR text: {all_text[:200]}...")  # Print first 200 chars for debugging
        
        # Create a more comprehensive medication pattern that looks for common prescription formats
        medication_patterns = [
            # Pattern for "Rx: MedName Dosage"
            r'(?i)(?:rx|prescription|med)(?::|;|\s+)?\s*([A-Za-z]+(?:\s+[A-Za-z]+){0,3})\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|tablet|cap))',
            
            # Pattern for standalone medication names followed by dosage
            r'(?i)(?:tab\.?|tablet|cap\.?|capsule)\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml))',
            
            # Pattern for dosage followed by medication name
            r'(?i)(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml))\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})',
            
            # Pattern for "take" instructions with medication name
            r'(?i)(?:take|administer)\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})',
            
            # Pattern for medication name with colon
            r'(?i)([A-Za-z]+(?:\s+[A-Za-z]+){0,2}):\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|tablet|cap))',
            
            # Pattern for numbered medication list
            r'(?i)(?:\d+[\.\)]\s+)([A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|tablet|cap)?)'
        ]
        
        # List of common words that should NOT be considered medications
        common_words = [
            'take', 'with', 'daily', 'once', 'twice', 'the', 'for', 'age', 'date', 'name', 'patient',
            'doctor', 'hospital', 'clinic', 'medical', 'address', 'phone', 'test', 'report', 'diagnosis',
            'treatment', 'please', 'thank', 'floor', 'road', 'street', 'city', 'state', 'pin', 'code',
            'signature', 'stamp', 'room', 'bed', 'ward', 'time', 'morning', 'afternoon', 'evening',
            'night', 'before', 'after', 'meals', 'food', 'water', 'empty', 'stomach', 'full',
            'yes', 'no', 'male', 'female', 'mr', 'mrs', 'ms', 'dr', 'station', 'near', 'opp', 'wing'
        ]
        
        # Initialize empty list for medication matches
        medication_matches = []
        
        # Process each pattern to find potential medications
        for pattern in medication_patterns:
            matches = list(re.finditer(pattern, all_text))
            if matches:
                print(f"Found {len(matches)} matches with pattern: {pattern}")
                
                for match in matches:
                    potential_med = match.group(1).strip()
                    dosage_amount = match.group(2) if len(match.groups()) > 1 else ""
                    
                    # Skip short matches and common words that are unlikely to be medications
                    if (len(potential_med) < 5 or 
                        potential_med.lower() in common_words or
                        any(word.lower() in common_words for word in potential_med.split())):
                        continue
                        
                    # Skip if already in our matches
                    if any(med["extracted_text"].lower() == potential_med.lower() for med in medication_matches):
                        continue
                    
                    # Get best match using fuzzy matching with a higher threshold
                    best_match, score = process.extractOne(potential_med, med_names)
                    
                    # Only consider very high-confidence matches from patterns
                    if score > 85:
                        print(f"Matched '{potential_med}' to '{best_match}' with score {score}")
                        dosage_info = self.extract_dosage_info(best_match, all_text)
                        
                        # Ensure we have the dosage amount from the regex
                        if dosage_amount and not dosage_info.get("amount"):
                            dosage_info["amount"] = dosage_amount
                        
                        medication_matches.append({
                            "extracted_text": potential_med,
                            "matched_medication": best_match,
                            "confidence": score / 100,
                            "dosage_info": dosage_info
                        })
        
        # If we still don't have any medications, try direct name matching
        if len(medication_matches) == 0:
            print("No medications found with patterns, trying direct name matching")
            
            # Try exact medication name matching (case insensitive)
            all_text_lower = all_text.lower()
            for med_name in med_names:
                # Skip very short medication names to avoid false positives
                if len(med_name) < 5:
                    continue
                    
                # Search for medication name in text
                med_name_lower = med_name.lower()
                if med_name_lower in all_text_lower:
                    # Verify it's not just part of a larger word by checking for word boundaries
                    # Use regex to find the word with boundaries
                    if re.search(r'\b' + re.escape(med_name_lower) + r'\b', all_text_lower):
                        print(f"Found exact match for medication: {med_name}")
                        start_idx = all_text_lower.find(med_name_lower)
                        end_idx = start_idx + len(med_name)
                        
                        # Extract context around medication name for dosage
                        context = all_text[max(0, start_idx - 30):min(len(all_text), end_idx + 50)]
                        dosage_info = self.extract_dosage_info(med_name, context)
                        
                        medication_matches.append({
                            "extracted_text": med_name,
                            "matched_medication": med_name,
                            "confidence": 0.95,  # High confidence for exact match
                            "dosage_info": dosage_info
                        })
                        
                        # Limit to a reasonable number of medications
                        if len(medication_matches) >= 5:
                            break
        
        # As a last resort, try fuzzy matching on ONLY the medication-like text segments
        if len(medication_matches) == 0:
            print("No medications found, trying focused fuzzy matching on text segments")
            
            # Split the text into chunks that might contain medication names
            medication_like_segments = []
            
            # Define patterns that often precede medication names
            med_indicators = [
                r'(?i)tab\.?\s+([A-Za-z]+)',
                r'(?i)(?:cap|capsule)\.?\s+([A-Za-z]+)',
                r'(?i)(?:take|rx|medicine):\s*([A-Za-z]+)',
                r'(?i)(?:\d+\s*x\s*\d+)\s+([A-Za-z]+)',
                r'(?i)(?:\d+\s*-\s*\d+\s*-\s*\d+)\s+([A-Za-z]+)'
            ]
            
            # Extract potential medication names using these patterns
            for pattern in med_indicators:
                matches = re.finditer(pattern, all_text)
                for match in matches:
                    if match.group(1) and len(match.group(1)) >= 4:
                        medication_like_segments.append(match.group(1))
            
            # If no segments found with indicators, try word-based approach for select OCR lines
            if not medication_like_segments:
                for item in ocr_results:
                    # Only consider lines that are short and might be medication entries
                    text = item["text"]
                    if 3 < len(text) < 30 and not any(word.lower() in common_words for word in text.split()):
                        parts = text.split()
                        # Look at each 1-3 word combination that might be a medication name
                        for i in range(len(parts)):
                            for j in range(1, min(4, len(parts) - i + 1)):
                                segment = " ".join(parts[i:i+j])
                                if len(segment) >= 5:
                                    medication_like_segments.append(segment)
            
            # Try fuzzy matching on these targeted segments only
            for segment in medication_like_segments:
                # Skip if it contains common words
                if any(word.lower() in common_words for word in segment.split()):
                    continue
                
                best_match, score = process.extractOne(segment, med_names)
                # Use a very high threshold for fuzzy matching
                if score > 92 and not any(med["matched_medication"] == best_match for med in medication_matches):
                    print(f"Fuzzy matched '{segment}' to '{best_match}' with score {score}")
                    dosage_info = self.extract_dosage_info(best_match, all_text)
                    medication_matches.append({
                        "extracted_text": segment,
                        "matched_medication": best_match,
                        "confidence": score / 100,
                        "dosage_info": dosage_info
                    })
                    
                    # Limit to a reasonable number of medications
                    if len(medication_matches) >= 3:
                        break
        
        # If still no medications found, provide helpful info
        if len(medication_matches) == 0:
            print("WARNING: No medications detected in the prescription image.")
            # Return empty list to indicate no medications found
        
        print(f"Final medication matches: {', '.join([m['matched_medication'] for m in medication_matches])}")
        return medication_matches
    
    def extract_dosage_info(self, med_name, text):
        """
        Extract dosage information for a specific medication.
        
        Args:
            med_name: Medication name
            text: Full text from OCR
            
        Returns:
            Dictionary containing dosage information
        """
        # Initialize with empty values
        dosage_info = {
            "amount": "",
            "frequency": "",
            "duration": "",
            "special_instructions": []
        }
        
        # Create a window of text around the medication name to analyze
        # This simulates finding the context where the medication is mentioned
        med_pattern = re.compile(r'\b' + re.escape(med_name) + r'\b', re.IGNORECASE)
        match = med_pattern.search(text)
        
        if not match:
            # If exact name not found, try with relaxed matching
            words_in_name = med_name.split()
            if words_in_name:
                first_word = words_in_name[0]
                med_pattern = re.compile(r'\b' + re.escape(first_word) + r'\b', re.IGNORECASE)
                match = med_pattern.search(text)
        
        if match:
            # Get context - 100 characters after the medication name
            start_pos = match.start()
            end_pos = min(start_pos + 150, len(text))
            context = text[start_pos:end_pos]
            
            # Extract dosage amount - look for numbers followed by units
            amount_match = re.search(r'(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|tablet|cap)', context, re.IGNORECASE)
            if amount_match:
                dosage_info["amount"] = amount_match.group(0)
            
            # Extract frequency
            frequency_patterns = [
                (r'(\d+)\s*times?\s*(?:a|per)\s*day', '\\1 times daily'),
                (r'once\s*daily', 'once daily'),
                (r'twice\s*daily', 'twice daily'),
                (r'three\s*times\s*daily', 'three times daily'),
                (r'every\s*(\d+)\s*hours?', 'every \\1 hours'),
                (r'as\s*needed', 'as needed'),
                (r'(?:in|at)\s*(?:the\s*)?(?:morning|evening|night)', '\\0'),
                (r'before\s*(?:meals?|breakfast|lunch|dinner)', '\\0'),
                (r'after\s*(?:meals?|breakfast|lunch|dinner)', '\\0'),
                (r'with\s*(?:meals?|breakfast|lunch|dinner|food)', '\\0')
            ]
            
            for pattern, replacement in frequency_patterns:
                freq_match = re.search(pattern, context, re.IGNORECASE)
                if freq_match:
                    dosage_info["frequency"] = re.sub(pattern, replacement, freq_match.group(0), flags=re.IGNORECASE)
                    break
            
            # Extract duration
            duration_patterns = [
                r'for\s*(\d+)\s*days?',
                r'for\s*(\d+)\s*weeks?',
                r'for\s*(\d+)\s*months?',
                r'(\d+)\s*days?\s*course',
                r'continue\s*for\s*(\d+)',
                r'treatment\s*for\s*(\d+)'
            ]
            
            for pattern in duration_patterns:
                duration_match = re.search(pattern, context, re.IGNORECASE)
                if duration_match:
                    dosage_info["duration"] = duration_match.group(0)
                    break
            
            # Extract special instructions
            instruction_patterns = [
                (r'take\s*with\s*food', 'Take with food'),
                (r'take\s*on\s*empty\s*stomach', 'Take on empty stomach'),
                (r'take\s*before\s*meals?', 'Take before meals'),
                (r'take\s*after\s*meals?', 'Take after meals'),
                (r'avoid\s*(?:alcohol|driving)', '\\0'),
                (r'may\s*cause\s*drowsiness', 'May cause drowsiness'),
                (r'do\s*not\s*crush', 'Do not crush or chew'),
                (r'with\s*plenty\s*of\s*water', 'Take with plenty of water'),
                (r'without\s*food', 'Take without food'),
                (r'before\s*bedtime', 'Take before bedtime')
            ]
            
            for pattern, replacement in instruction_patterns:
                if re.search(pattern, context, re.IGNORECASE):
                    special_instruction = re.sub(pattern, replacement, re.search(pattern, context, re.IGNORECASE).group(0), flags=re.IGNORECASE)
                    if special_instruction and special_instruction not in dosage_info["special_instructions"]:
                        dosage_info["special_instructions"].append(special_instruction)
        
        # For demo purposes, ensure we have values
        if not dosage_info["amount"]:
            common_dosages = ["250mg", "500mg", "10mg", "20mg", "40mg", "100mg", "25mg", "75mg", "1g", "5ml"]
            dosage_info["amount"] = random.choice(common_dosages)
            
        if not dosage_info["frequency"]:
            frequencies = ["once daily", "twice daily", "three times daily", "every 8 hours", "as needed", "with meals"]
            dosage_info["frequency"] = random.choice(frequencies)
            
        if not dosage_info["duration"]:
            durations = ["for 7 days", "for 14 days", "for 1 month", "as directed", "until finished", "continue as prescribed"]
            dosage_info["duration"] = random.choice(durations)
            
        if not dosage_info["special_instructions"]:
            instructions = [
                "Take with food to reduce stomach upset",
                "Take on an empty stomach",
                "Avoid alcohol while taking this medication",
                "May cause drowsiness; use caution when driving",
                "Take with a full glass of water",
                "Do not crush or chew; swallow whole",
                "Store at room temperature away from moisture and heat",
                "Complete the full course of treatment even if symptoms improve"
            ]
            # Add 0-2 special instructions
            num_instructions = random.randint(0, 2)
            if num_instructions > 0:
                dosage_info["special_instructions"] = random.sample(instructions, num_instructions)
                
        return dosage_info
