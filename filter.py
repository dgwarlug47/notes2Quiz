import json

# Input and output file paths
INPUT_FILE = 'quiz_questions_unfiltered.json'
OUTPUT_FILE = 'quiz_questions.json'

# Read the input JSON file
with open(INPUT_FILE, 'r', encoding='utf-8') as infile:
    data = json.load(infile)

# Filter items where 'show' is True
filtered = [item for item in data if item.get('show') is True]

# Write the filtered items to the output file
with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
    json.dump(filtered, outfile, ensure_ascii=False, indent=2)

print(f"Filtered {len(filtered)} items to {OUTPUT_FILE}")
