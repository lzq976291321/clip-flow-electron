import { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import pkg from "./package.json";

// Vite 配置文件
// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // 在构建前清理 dist-electron 目录
  rmSync("dist-electron", { recursive: true, force: true });

  // 确定当前环境
  const isServe = command === "serve"; // 开发服务器环境
  const isBuild = command === "build"; // 构建环境
  // 根据环境决定是否生成 sourcemap
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    // 基础公共路径
    base: "/",
    // 静态资源目录
    publicDir: "public",

    // 路径别名配置
    resolve: {
      alias: {
        "@": path.join(__dirname, "src"),
      },
    },

    // 插件配置
    plugins: [
      // React 插件
      react(),
      // Electron 插件配置
      electron({
        // 主进程配置
        main: {
          // 入口文件路径
          entry: "electron/main/index.ts",
          // 启动配置
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log("[startup] Electron App");
            } else {
              args.startup();
            }
          },
          // 主进程的 vite 配置
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: "dist-electron/main",
              rollupOptions: {
                // 外部依赖配置
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {}
                ),
              },
            },
          },
        },

        // 预加载脚本配置
        preload: {
          // 预加载脚本入口
          input: "electron/preload/index.ts",
          vite: {
            build: {
              // 内联 sourcemap 配置
              sourcemap: sourcemap ? "inline" : undefined,
              minify: isBuild,
              outDir: "dist-electron/preload",
              rollupOptions: {
                external: Object.keys(
                  "dependencies" in pkg ? pkg.dependencies : {}
                ),
              },
            },
          },
        },

        // 渲染进程配置
        // 用于在渲染进程中使用 Electron 和 Node.js API
        renderer: {},
      }),
    ],

    // 开发服务器配置
    server: {
      fs: {
        // 允许访问项目根目录以外的文件
        allow: [".."],
      },
    },

    // 是否清除终端屏幕
    clearScreen: false,

    // Electron 特定配置
    // electron: {
    //   build: {
    //     rollupOptions: {
    //       output: {
    //         // 自定义资源文件名
    //         assetFileNames: (assetInfo) => {
    //           if (assetInfo.name === "clip-flow.ico") {
    //             return "clip-flow.ico";
    //           }
    //           return "assets/[name]-[hash][extname]";
    //         },
    //       },
    //     },
    //     config: {
    //       // macOS 特定配置
    //       mac: {
    //         // 权限配置文件路径
    //         entitlements: "build/entitlements.mac.plist",
    //         entitlementsInherit: "build/entitlements.mac.plist",
    //       },
    //     },
    //   },
    // },
  };
});
