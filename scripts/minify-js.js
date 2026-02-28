const fs = require('fs').promises;
const path = require('path');
const terser = require('terser');

(async () => {
  try {
    const projectRoot = path.join(__dirname, '..');
    const srcDir = path.join(projectRoot, 'assets', 'js', 'src');
    const outDir = path.join(projectRoot, 'assets', 'js', 'dist');
    
    // Ensure the output directory exists
    await fs.mkdir(outDir, { recursive: true });
    const files = await fs.readdir(srcDir);
    
    // Map over the files and run them concurrently
    const minifyTasks = files.map(async (name) => {
      // Skip non-js or already minified files
      if (!name.endsWith('.js') || name.endsWith('.min.js')) return;
      
      const srcPath = path.join(srcDir, name);
      const code = await fs.readFile(srcPath, 'utf8');
      
      const outName = name.replace(/\.js$/, '.min.js');
      const outPath = path.join(outDir, outName);
      const mapName = outName + '.map';
      const mapPath = path.join(outDir, mapName);
      
      const result = await terser.minify(code, {
        compress: true,
        mangle: true,
        sourceMap: {
          filename: outName,
          url: mapName // Terser automatically adds the sourceMappingURL comment
        }
      });
      
      if (result.error) throw result.error;
      
      // Write both the minified code and the map file simultaneously
      await Promise.all([
        fs.writeFile(outPath, result.code, 'utf8'),
        fs.writeFile(mapPath, result.map, 'utf8')
      ]);
      
      console.log(`✅ Minified: ${outName}`);
    });

    // Wait for all files to finish processing
    await Promise.all(minifyTasks);
    
    console.log('🎉 All JavaScript minified successfully!');

  } catch (err) {
    console.error('❌ Minify failed:', err);
    process.exitCode = 1;
  }
})();