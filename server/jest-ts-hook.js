const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const nodeModulesSegment = `${path.sep}node_modules${path.sep}`;

require.extensions[".ts"] = (module, filename) => {
  if (filename.includes(nodeModulesSegment)) {
    const source = fs.readFileSync(filename, "utf8");
    module._compile(source, filename);
    return;
  }

  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: filename,
  });

  module._compile(outputText, filename);
};
