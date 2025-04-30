import json
import re
import os

input_filename = 'all_versions_data.json'
output_filename = 'all_versions_data_CLEANED.json'

cleaned_data = []
issues_found = 0

print(f"Reading from {input_filename}...")

try:
    # Specify encoding, adjust if needed (e.g., 'utf-8-sig' for BOM)
    with open(input_filename, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Processing {len(data)} records...")

    for record in data:
        original_wav_name = record.get('wav file name')
        cleaned_wav_name = original_wav_name

        if isinstance(cleaned_wav_name, str):
            # Stronger cleaning: Remove leading/trailing whitespace AND
            # potentially problematic Unicode control/separator chars
            # This regex removes various whitespace AND common invisible format chars
            cleaned_wav_name = re.sub(r'^[\s\u200B-\u200D\uFEFF]+|[\s\u200B-\u200D\uFEFF]+$', '', cleaned_wav_name)

            if cleaned_wav_name != original_wav_name:
                print(f"  Cleaned '{original_wav_name}' -> '{cleaned_wav_name}'")
                record['wav file name'] = cleaned_wav_name # Update the record
                issues_found += 1
        elif original_wav_name is not None:
             print(f"  Warning: 'wav file name' is not a string: {original_wav_name}")


        cleaned_data.append(record) # Add record (cleaned or original) to new list

    print(f"Processed {len(data)} records. Found and cleaned issues in {issues_found} records.")

    # Write cleaned data to a NEW file
    print(f"Writing cleaned data to {output_filename}...")
    with open(output_filename, 'w', encoding='utf-8') as f:
         # Use ensure_ascii=False to preserve non-ASCII chars, indent for readability
        json.dump(cleaned_data, f, indent=2, ensure_ascii=False)

    print("Done.")

except FileNotFoundError:
    print(f"Error: Input file '{input_filename}' not found.")
except json.JSONDecodeError as e:
    print(f"Error decoding JSON: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")