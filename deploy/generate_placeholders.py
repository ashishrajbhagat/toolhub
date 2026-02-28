import base64, os
b64='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII='
outdir=r'C:\Users\Ashish Raj\Desktop\Projects\MyToolKitPro\assets\img'
if not os.path.exists(outdir):
    os.makedirs(outdir)
sizes=[72,96,128,144,152,192,384,512]
for s in sizes:
    path=os.path.join(outdir,f'icon-{s}.png')
    with open(path,'wb') as f:
        f.write(base64.b64decode(b64))
    print('Wrote',path)
