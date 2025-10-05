import requests
import json
import os
from time import sleep

# --- Configuration ---
# Coordinates for Mawsynram, India
LATITUDE = 25.2970
LONGITUDE = 91.5822

# List of years to fetch data for (June 1st to September 30th)
TARGET_YEARS = [2024, 2023, 2022]

# The directory where the JSON files will be saved
OUTPUT_DIR = 'src/data'

# Base URL for the NASA POWER Daily API
BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point'

# Common parameters for the API request
COMMON_PARAMS = {
    'latitude': LATITUDE,
    'longitude': LONGITUDE,
    'community': 'RE',
    'parameters': 'T2M,PRECTOTCORR,GWETPROF,ALLSKY_SFC_SW_DWN',
    'format': 'JSON'
}
# ---------------------

def fetch_and_save_data():
    """
    Fetches daily climate data from the NASA POWER API for specified years 
    and saves the raw JSON response locally.
    """
    
    # 1. Ensure the output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Ensured directory '{OUTPUT_DIR}' exists.")

    for year in TARGET_YEARS:
        print(f"\n--- Starting fetch for year {year} (June 1st - Sept 30th) ---")
        
        # 2. Construct the date parameters for the current year
        start_date = f'{year}0601'
        end_date = f'{year}0930'

        # Merge date parameters with common parameters
        params = COMMON_PARAMS.copy()
        params['start'] = start_date
        params['end'] = end_date
        
        try:
            # 3. Make the API request
            print(f"Requesting data for {start_date} to {end_date}...")
            response = requests.get(BASE_URL, params=params)
            
            # Check for HTTP errors
            response.raise_for_status() 

            data = response.json()
            
            # 4. Define the output file path
            file_name = f'mawsynram-{year}.json'
            file_path = os.path.join(OUTPUT_DIR, file_name)
            
            # 5. Save the JSON data to the local file
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=4)
            
            print(f"SUCCESS: Data saved to {file_path}")

        except requests.exceptions.RequestException as e:
            print(f"ERROR: Failed to fetch data for {year}. Request Exception: {e}")
        except json.JSONDecodeError:
            print(f"ERROR: Could not decode JSON response for {year}. Received text: {response.text[:100]}...")
        
        # Be polite to the API by waiting a moment between requests
        sleep(1)

if __name__ == "__main__":
    fetch_and_save_data()
