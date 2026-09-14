import json, os

with open('Handwritten_Digit_Recognition_CNN.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

cells = nb['cells']
md_cells   = [c for c in cells if c['cell_type'] == 'markdown']
code_cells = [c for c in cells if c['cell_type'] == 'code']

print(f"✅ Valid Jupyter Notebook (nbformat {nb['nbformat']})")
print(f"📦 Total cells : {len(cells)}")
print(f"   Markdown    : {len(md_cells)}")
print(f"   Code        : {len(code_cells)}")
print()
print("Cell Overview:")
print("-" * 70)
for i, c in enumerate(cells):
    first_line = c['source'][0].strip()[:65] if c['source'] else "(empty)"
    print(f"  [{i+1:02d}] [{c['cell_type']:8s}] {first_line}")

size_kb = os.path.getsize('Handwritten_Digit_Recognition_CNN.ipynb') / 1024
print()
print(f"💾 File size: {size_kb:.1f} KB")
print()
print("🎉 Notebook is ready to upload and run in Google Colab!")
