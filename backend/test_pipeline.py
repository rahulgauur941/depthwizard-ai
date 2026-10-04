import json
import urllib.request
import urllib.parse
import mimetypes
import uuid

def multipart_encode(files, fields):
    boundary = uuid.uuid4().hex
    crlf = b"\r\n"
    lines = []
    for (name, val) in fields.items():
        lines.append(f"--{boundary}".encode())
        lines.append(f'Content-Disposition: form-data; name="{name}"'.encode())
        lines.append(b"")
        lines.append(str(val).encode())
    for (name, filepath) in files.items():
        lines.append(f"--{boundary}".encode())
        lines.append(f'Content-Disposition: form-data; name="{name}"; filename="aerial.jpg"'.encode())
        lines.append(b"Content-Type: image/jpeg")
        lines.append(b"")
        with open(filepath, "rb") as f:
            lines.append(f.read())
    lines.append(f"--{boundary}--".encode())
    lines.append(b"")
    body = crlf.join(lines)
    content_type = f"multipart/form-data; boundary={boundary}"
    return content_type, body

def form_encode(fields):
    data = urllib.parse.urlencode(fields).encode()
    content_type = "application/x-www-form-urlencoded"
    return content_type, data

def test():
    # 1. Upload
    c_type, body = multipart_encode({'file': 'static/demo/urban_aerial.jpg'}, {})
    req = urllib.request.Request("http://127.0.0.1:8000/api/upload", data=body, headers={"Content-Type": c_type})
    with urllib.request.urlopen(req) as resp:
        upload_data = json.loads(resp.read().decode())
    print("Upload Status: OK")
    image_id = upload_data["image_id"]
    print(f"Image ID: {image_id}")

    # 2. Process
    c_type, body = form_encode({
        "image_id": image_id,
        "is_calibrated": "true",
        "gsd": "0.35",
        "camera_altitude": "500",
        "reference_height": "112"
    })
    req2 = urllib.request.Request("http://127.0.0.1:8000/api/process", data=body, headers={"Content-Type": c_type})
    with urllib.request.urlopen(req2) as resp2:
        process_data = json.loads(resp2.read().decode())

    print("Process Status:", process_data.get("status"))
    objects = process_data.get("objects", [])
    print(f"Total objects detected: {len(objects)}")
    for i, obj in enumerate(objects[:5]):
        print(f"  Obj {i+1}: {obj['name']}")
        print(f"    Height: {obj['estimated_height']}m | Roof: {obj.get('roof_type')} | Confidence: {obj['confidence']}")
        print(f"    Polygon vertices: {len(obj.get('polygon', []))} | Centroid: {obj.get('centroid')}")

    print("Ground Map URL:", process_data.get("ground_map_url"))
    print("Mesh OBJ URL:", process_data.get("mesh_obj_url"))
    print("Height Stats:", process_data.get("height_stats", {}).get("max_height"), "m max")

    # Inspect the generated OBJ file
    obj_url = process_data.get("mesh_obj_url")
    obj_filename = obj_url.replace("/outputs/", "")
    obj_path = f"outputs/{obj_filename}"
    with open(obj_path, "r", encoding="utf-8") as f:
        obj_content = f.read()

    print(f"\nGenerated OBJ Analysis ({obj_path}):")
    print(f"  Total lines in OBJ: {len(obj_content.splitlines())}")
    ground_count = obj_content.count("o Ground_Terrain")
    building_count = obj_content.count("o Building_")
    v_count = obj_content.count("\nv ")
    f_count = obj_content.count("\nf ")
    print(f"  Ground terrain groups: {ground_count}")
    print(f"  Extruded building groups: {building_count}")
    print(f"  Total 3D vertices: {v_count}")
    print(f"  Total 3D faces: {f_count}")

if __name__ == '__main__':
    test()
