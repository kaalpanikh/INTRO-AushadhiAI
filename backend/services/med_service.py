import json
import os

class MedicationService:
    def __init__(self):
        """
        Initialize the medication service by loading medication data from JSON.
        """
        # Get the path to the medications.json file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(os.path.dirname(current_dir), 'data')
        meds_file = os.path.join(data_dir, 'medications.json')
        
        # Load medications data
        with open(meds_file, 'r') as f:
            self.medications = json.load(f)
        
        # Create a mapping from medication name/alias to canonical name for quick lookup
        self.med_name_to_canonical = {}
        for med in self.medications:
            canonical_name = med["name"].lower()
            self.med_name_to_canonical[canonical_name] = med["name"]
            
            # Also add aliases
            for alias in med.get("aliases", []):
                self.med_name_to_canonical[alias.lower()] = med["name"]
    
    def get_all_medication_names(self):
        """
        Get a list of all medication names and aliases for matching.
        
        Returns:
            List of medication names and aliases
        """
        return list(self.med_name_to_canonical.keys())
    
    def get_medication_details(self, name):
        """
        Get detailed information about a medication by name.
        
        Args:
            name: Name of the medication (can be canonical name or alias)
            
        Returns:
            Dictionary containing medication details or None if not found
        """
        name_lower = name.lower()
        canonical_name = self.med_name_to_canonical.get(name_lower)
        
        if canonical_name:
            for med in self.medications:
                if med["name"] == canonical_name:
                    return med
        
        return None
