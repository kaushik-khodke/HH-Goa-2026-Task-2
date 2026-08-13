import zipfile
import xml.etree.ElementTree as ET
import os

docx_path = r"c:\Users\ASUS\jupyter notebook\priyal\task 2_ hhg.docx"
output_path = r"c:\Users\ASUS\jupyter notebook\priyal\scratch\docx_text.txt"

os.makedirs(os.path.dirname(output_path), exist_ok=True)

try:
    with zipfile.ZipFile(docx_path, 'r') as z:
        xml_content = z.read('word/document.xml')
        tree = ET.fromstring(xml_content)
        
        # Namespace for Word processing ML
        namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        paragraphs = []
        for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
            texts = [node.text for node in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text]
            if texts:
                paragraphs.append("".join(texts))
                
        full_text = "\n".join(paragraphs)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(full_text)
            
        print(f"Successfully extracted {len(paragraphs)} paragraphs to {output_path}")

except Exception as e:
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(f"Error: {e}")
    print(f"Failed to extract docx: {e}")
