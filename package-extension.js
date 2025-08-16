const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

// Files to include in the extension package
const filesToInclude = [
  "manifest.json",
  "content.js",
  "background.js",
  "popup.html",
  "popup.js",
  "popup.css",
  "options.html",
  "options.js",
  "options.css",
  "styles.css",
  "README.md",
  "LICENSE",
];

// Directories to include
const dirsToInclude = ["icons"];

async function packageExtension() {
  const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
  const outputFilename = `chatgpt-pinned-conversations-v${manifest.version}.zip`;

  console.log(`📦 Creating extension package: ${outputFilename}`);

  // Create a file to stream archive data to
  const output = fs.createWriteStream(outputFilename);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Best compression
  });

  output.on("close", function () {
    console.log(`✅ Package created successfully!`);
    console.log(`📊 Total size: ${archive.pointer()} bytes`);
    console.log(`📁 File: ${outputFilename}`);
    console.log(`\n🚀 Ready for Chrome Web Store upload!`);
  });

  archive.on("warning", function (err) {
    if (err.code === "ENOENT") {
      console.warn(`⚠️  Warning: ${err.message}`);
    } else {
      throw err;
    }
  });

  archive.on("error", function (err) {
    throw err;
  });

  archive.pipe(output);

  // Add files
  for (const file of filesToInclude) {
    if (fs.existsSync(file)) {
      archive.file(file, { name: file });
      console.log(`📄 Added: ${file}`);
    } else {
      console.warn(`⚠️  Missing: ${file}`);
    }
  }

  // Add directories
  for (const dir of dirsToInclude) {
    if (fs.existsSync(dir)) {
      archive.directory(dir, dir);
      console.log(`📁 Added directory: ${dir}/`);
    } else {
      console.warn(`⚠️  Missing directory: ${dir}/`);
    }
  }

  // Finalize the archive
  await archive.finalize();
}

// Check for required icons
function checkIcons() {
  const requiredIcons = [
    "icons/16x16.png",
    "icons/48x48.png",
    "icons/128x128.png",
  ];
  const missingIcons = requiredIcons.filter((icon) => !fs.existsSync(icon));

  if (missingIcons.length > 0) {
    console.log("❌ Missing required icons:");
    missingIcons.forEach((icon) => console.log(`   - ${icon}`));
    console.log("\n📝 Please create the missing icons before packaging.");
    console.log("   See icons/README.md for guidelines.");
    return false;
  }

  console.log("✅ All required icons found!");
  return true;
}

// Main execution
if (checkIcons()) {
  packageExtension().catch(console.error);
} else {
  process.exit(1);
}
