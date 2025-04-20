/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/reports/route";
exports.ids = ["app/api/reports/route"];
exports.modules = {

/***/ "(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Freports%2Froute&page=%2Fapi%2Freports%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Freports%2Froute.ts&appDir=%2FUsers%2Fbrandonbrewer%2FDocuments%2FLinguosity%2FLinguosity%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fbrandonbrewer%2FDocuments%2FLinguosity%2FLinguosity&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Freports%2Froute&page=%2Fapi%2Freports%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Freports%2Froute.ts&appDir=%2FUsers%2Fbrandonbrewer%2FDocuments%2FLinguosity%2FLinguosity%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fbrandonbrewer%2FDocuments%2FLinguosity%2FLinguosity&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_brandonbrewer_Documents_Linguosity_Linguosity_src_app_api_reports_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/reports/route.ts */ \"(rsc)/./src/app/api/reports/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/reports/route\",\n        pathname: \"/api/reports\",\n        filename: \"route\",\n        bundlePath: \"app/api/reports/route\"\n    },\n    resolvedPagePath: \"/Users/brandonbrewer/Documents/Linguosity/Linguosity/src/app/api/reports/route.ts\",\n    nextConfigOutput,\n    userland: _Users_brandonbrewer_Documents_Linguosity_Linguosity_src_app_api_reports_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvLnBucG0vbmV4dEAxNS4yLjJfQG9wZW50ZWxlbWV0cnkrYXBpQDEuOS4wX3JlYWN0LWRvbUAxOC4zLjFfcmVhY3RAMTguMy4xX19yZWFjdEAxOC4zLjEvbm9kZV9tb2R1bGVzL25leHQvZGlzdC9idWlsZC93ZWJwYWNrL2xvYWRlcnMvbmV4dC1hcHAtbG9hZGVyL2luZGV4LmpzP25hbWU9YXBwJTJGYXBpJTJGcmVwb3J0cyUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGcmVwb3J0cyUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnJlcG9ydHMlMkZyb3V0ZS50cyZhcHBEaXI9JTJGVXNlcnMlMkZicmFuZG9uYnJld2VyJTJGRG9jdW1lbnRzJTJGTGluZ3Vvc2l0eSUyRkxpbmd1b3NpdHklMkZzcmMlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGYnJhbmRvbmJyZXdlciUyRkRvY3VtZW50cyUyRkxpbmd1b3NpdHklMkZMaW5ndW9zaXR5JmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PXN0YW5kYWxvbmUmcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDaUM7QUFDOUc7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIi9Vc2Vycy9icmFuZG9uYnJld2VyL0RvY3VtZW50cy9MaW5ndW9zaXR5L0xpbmd1b3NpdHkvc3JjL2FwcC9hcGkvcmVwb3J0cy9yb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJzdGFuZGFsb25lXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL3JlcG9ydHMvcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9yZXBvcnRzXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9yZXBvcnRzL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiL1VzZXJzL2JyYW5kb25icmV3ZXIvRG9jdW1lbnRzL0xpbmd1b3NpdHkvTGluZ3Vvc2l0eS9zcmMvYXBwL2FwaS9yZXBvcnRzL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Freports%2Froute&page=%2Fapi%2Freports%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Freports%2Froute.ts&appDir=%2FUsers%2Fbrandonbrewer%2FDocuments%2FLinguosity%2FLinguosity%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fbrandonbrewer%2FDocuments%2FLinguosity%2FLinguosity&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!**********************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \**********************************************************************************************************************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/./src/app/api/reports/route.ts":
/*!**************************************!*\
  !*** ./src/app/api/reports/route.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var _supabase_auth_helpers_nextjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/auth-helpers-nextjs */ \"(rsc)/./node_modules/.pnpm/@supabase+auth-helpers-nextjs@0.10.0_@supabase+supabase-js@2.49.4/node_modules/@supabase/auth-helpers-nextjs/dist/index.js\");\n/* harmony import */ var _supabase_auth_helpers_nextjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_supabase_auth_helpers_nextjs__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_headers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/headers */ \"(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/api/headers.js\");\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/api/server.js\");\n// FILE: src/app/api/reports/route.ts\n\n\n\nasync function GET(req) {\n    const url = new URL(req.url);\n    const userId = url.searchParams.get('userId');\n    if (!userId) {\n        return next_server__WEBPACK_IMPORTED_MODULE_2__.NextResponse.json({\n            error: 'Missing userId'\n        }, {\n            status: 400\n        });\n    }\n    const supabase = (0,_supabase_auth_helpers_nextjs__WEBPACK_IMPORTED_MODULE_0__.createRouteHandlerClient)({\n        cookies: next_headers__WEBPACK_IMPORTED_MODULE_1__.cookies\n    });\n    const { data, error } = await supabase.from('speech_language_reports').select('id, report').eq('user_id', userId);\n    if (error) {\n        return next_server__WEBPACK_IMPORTED_MODULE_2__.NextResponse.json({\n            error: error.message\n        }, {\n            status: 500\n        });\n    }\n    const result = data.map((entry)=>({\n            id: entry.id,\n            title: entry.report?.header?.studentInformation?.fullName ?? 'Untitled',\n            type: 'speech-language',\n            createDate: entry.report?.metadata?.createdAt ?? '',\n            updateDate: entry.report?.metadata?.lastUpdated ?? '',\n            studentName: entry.report?.header?.studentInformation?.fullName ?? '',\n            studentAge: entry.report?.header?.studentInformation?.age ?? ''\n        }));\n    return next_server__WEBPACK_IMPORTED_MODULE_2__.NextResponse.json(result);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9yZXBvcnRzL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUEscUNBQXFDO0FBQ21DO0FBQ2xDO0FBQ0k7QUFFbkMsZUFBZUcsSUFBSUMsR0FBWTtJQUNwQyxNQUFNQyxNQUFNLElBQUlDLElBQUlGLElBQUlDLEdBQUc7SUFDM0IsTUFBTUUsU0FBU0YsSUFBSUcsWUFBWSxDQUFDQyxHQUFHLENBQUM7SUFFcEMsSUFBSSxDQUFDRixRQUFRO1FBQ1gsT0FBT0wscURBQVlBLENBQUNRLElBQUksQ0FBQztZQUFFQyxPQUFPO1FBQWlCLEdBQUc7WUFBRUMsUUFBUTtRQUFJO0lBQ3RFO0lBRUEsTUFBTUMsV0FBV2IsdUZBQXdCQSxDQUFDO1FBQUVDLE9BQU9BLG1EQUFBQTtJQUFDO0lBQ3BELE1BQU0sRUFBRWEsSUFBSSxFQUFFSCxLQUFLLEVBQUUsR0FBRyxNQUFNRSxTQUMzQkUsSUFBSSxDQUFDLDJCQUNMQyxNQUFNLENBQUMsY0FDUEMsRUFBRSxDQUFDLFdBQVdWO0lBRWpCLElBQUlJLE9BQU87UUFDVCxPQUFPVCxxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO1lBQUVDLE9BQU9BLE1BQU1PLE9BQU87UUFBQyxHQUFHO1lBQUVOLFFBQVE7UUFBSTtJQUNuRTtJQUVBLE1BQU1PLFNBQVNMLEtBQUtNLEdBQUcsQ0FBQ0MsQ0FBQUEsUUFBVTtZQUNoQ0MsSUFBSUQsTUFBTUMsRUFBRTtZQUNaQyxPQUFPRixNQUFNRyxNQUFNLEVBQUVDLFFBQVFDLG9CQUFvQkMsWUFBWTtZQUM3REMsTUFBTTtZQUNOQyxZQUFZUixNQUFNRyxNQUFNLEVBQUVNLFVBQVVDLGFBQWE7WUFDakRDLFlBQVlYLE1BQU1HLE1BQU0sRUFBRU0sVUFBVUcsZUFBZTtZQUNuREMsYUFBYWIsTUFBTUcsTUFBTSxFQUFFQyxRQUFRQyxvQkFBb0JDLFlBQVk7WUFDbkVRLFlBQVlkLE1BQU1HLE1BQU0sRUFBRUMsUUFBUUMsb0JBQW9CVSxPQUFPO1FBQy9EO0lBRUEsT0FBT2xDLHFEQUFZQSxDQUFDUSxJQUFJLENBQUNTO0FBQzNCIiwic291cmNlcyI6WyIvVXNlcnMvYnJhbmRvbmJyZXdlci9Eb2N1bWVudHMvTGluZ3Vvc2l0eS9MaW5ndW9zaXR5L3NyYy9hcHAvYXBpL3JlcG9ydHMvcm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gRklMRTogc3JjL2FwcC9hcGkvcmVwb3J0cy9yb3V0ZS50c1xuaW1wb3J0IHsgY3JlYXRlUm91dGVIYW5kbGVyQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL2F1dGgtaGVscGVycy1uZXh0anMnXG5pbXBvcnQgeyBjb29raWVzIH0gZnJvbSAnbmV4dC9oZWFkZXJzJ1xuaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBHRVQocmVxOiBSZXF1ZXN0KSB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwocmVxLnVybClcbiAgY29uc3QgdXNlcklkID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ3VzZXJJZCcpXG5cbiAgaWYgKCF1c2VySWQpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ01pc3NpbmcgdXNlcklkJyB9LCB7IHN0YXR1czogNDAwIH0pXG4gIH1cblxuICBjb25zdCBzdXBhYmFzZSA9IGNyZWF0ZVJvdXRlSGFuZGxlckNsaWVudCh7IGNvb2tpZXMgfSlcbiAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAuZnJvbSgnc3BlZWNoX2xhbmd1YWdlX3JlcG9ydHMnKVxuICAgIC5zZWxlY3QoJ2lkLCByZXBvcnQnKVxuICAgIC5lcSgndXNlcl9pZCcsIHVzZXJJZClcblxuICBpZiAoZXJyb3IpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9LCB7IHN0YXR1czogNTAwIH0pXG4gIH1cblxuICBjb25zdCByZXN1bHQgPSBkYXRhLm1hcChlbnRyeSA9PiAoe1xuICAgIGlkOiBlbnRyeS5pZCxcbiAgICB0aXRsZTogZW50cnkucmVwb3J0Py5oZWFkZXI/LnN0dWRlbnRJbmZvcm1hdGlvbj8uZnVsbE5hbWUgPz8gJ1VudGl0bGVkJyxcbiAgICB0eXBlOiAnc3BlZWNoLWxhbmd1YWdlJyxcbiAgICBjcmVhdGVEYXRlOiBlbnRyeS5yZXBvcnQ/Lm1ldGFkYXRhPy5jcmVhdGVkQXQgPz8gJycsXG4gICAgdXBkYXRlRGF0ZTogZW50cnkucmVwb3J0Py5tZXRhZGF0YT8ubGFzdFVwZGF0ZWQgPz8gJycsXG4gICAgc3R1ZGVudE5hbWU6IGVudHJ5LnJlcG9ydD8uaGVhZGVyPy5zdHVkZW50SW5mb3JtYXRpb24/LmZ1bGxOYW1lID8/ICcnLFxuICAgIHN0dWRlbnRBZ2U6IGVudHJ5LnJlcG9ydD8uaGVhZGVyPy5zdHVkZW50SW5mb3JtYXRpb24/LmFnZSA/PyAnJ1xuICB9KSlcblxuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24ocmVzdWx0KVxufSJdLCJuYW1lcyI6WyJjcmVhdGVSb3V0ZUhhbmRsZXJDbGllbnQiLCJjb29raWVzIiwiTmV4dFJlc3BvbnNlIiwiR0VUIiwicmVxIiwidXJsIiwiVVJMIiwidXNlcklkIiwic2VhcmNoUGFyYW1zIiwiZ2V0IiwianNvbiIsImVycm9yIiwic3RhdHVzIiwic3VwYWJhc2UiLCJkYXRhIiwiZnJvbSIsInNlbGVjdCIsImVxIiwibWVzc2FnZSIsInJlc3VsdCIsIm1hcCIsImVudHJ5IiwiaWQiLCJ0aXRsZSIsInJlcG9ydCIsImhlYWRlciIsInN0dWRlbnRJbmZvcm1hdGlvbiIsImZ1bGxOYW1lIiwidHlwZSIsImNyZWF0ZURhdGUiLCJtZXRhZGF0YSIsImNyZWF0ZWRBdCIsInVwZGF0ZURhdGUiLCJsYXN0VXBkYXRlZCIsInN0dWRlbnROYW1lIiwic3R1ZGVudEFnZSIsImFnZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/reports/route.ts\n");

/***/ }),

/***/ "(ssr)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!**********************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \**********************************************************************************************************************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1","vendor-chunks/tr46@0.0.3","vendor-chunks/@supabase+auth-js@2.69.1","vendor-chunks/@supabase+realtime-js@2.11.2","vendor-chunks/@opentelemetry+api@1.9.0","vendor-chunks/@supabase+postgrest-js@1.19.4","vendor-chunks/@supabase+node-fetch@2.6.15","vendor-chunks/whatwg-url@5.0.0","vendor-chunks/@supabase+storage-js@2.7.1","vendor-chunks/@supabase+supabase-js@2.49.4","vendor-chunks/@supabase+functions-js@2.4.4","vendor-chunks/webidl-conversions@3.0.1","vendor-chunks/jose@4.15.9","vendor-chunks/@supabase+auth-helpers-shared@0.7.0_@supabase+supabase-js@2.49.4","vendor-chunks/set-cookie-parser@2.7.1","vendor-chunks/@supabase+auth-helpers-nextjs@0.10.0_@supabase+supabase-js@2.49.4"], () => (__webpack_exec__("(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Freports%2Froute&page=%2Fapi%2Freports%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Freports%2Froute.ts&appDir=%2FUsers%2Fbrandonbrewer%2FDocuments%2FLinguosity%2FLinguosity%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fbrandonbrewer%2FDocuments%2FLinguosity%2FLinguosity&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();