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
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var _lib_supabase_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @/lib/supabase/server */ \"(rsc)/./src/lib/supabase/server.ts\");\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/api/server.js\");\n\n\nasync function GET(req) {\n    const url = new URL(req.url);\n    const userId = url.searchParams.get('userId');\n    const reportId = url.searchParams.get('id'); // optional specific report\n    const cookieStore = await __webpack_require__.e(/*! import() */ \"vendor-chunks/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1\").then(__webpack_require__.bind(__webpack_require__, /*! next/headers */ \"(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/api/headers.js\")).then((m)=>m.cookies());\n    if (!userId) {\n        return next_server__WEBPACK_IMPORTED_MODULE_1__.NextResponse.json({\n            error: 'Missing userId'\n        }, {\n            status: 400\n        });\n    }\n    const supabase = await (0,_lib_supabase_server__WEBPACK_IMPORTED_MODULE_0__.createClient)(cookieStore);\n    // If reportId is provided, fetch a single report\n    if (reportId) {\n        const { data, error } = await supabase.from('speech_language_reports').select('*') // Return full row\n        .eq('id', reportId).eq('user_id', userId).single();\n        if (error) {\n            console.error(\"Error fetching report by ID:\", error);\n            return next_server__WEBPACK_IMPORTED_MODULE_1__.NextResponse.json({\n                error: error.message\n            }, {\n                status: 500\n            });\n        }\n        // Enhanced logging for better visibility of nested structures\n        console.log(\"Fetched report (by ID) - Structure check:\", {\n            hasId: Boolean(data?.id),\n            hasUserId: Boolean(data?.user_id),\n            hasReport: Boolean(data?.report),\n            reportType: typeof data?.report,\n            reportHasHeader: Boolean(data?.report?.header),\n            reportHasStudentInfo: Boolean(data?.report?.header?.studentInformation),\n            studentInfoFields: data?.report?.header?.studentInformation ? Object.keys(data.report.header.studentInformation) : []\n        });\n        // Full data dump for complete visibility\n        console.log(\"Fetched report JSON:\", JSON.stringify(data, null, 2));\n        return next_server__WEBPACK_IMPORTED_MODULE_1__.NextResponse.json(data); // Return the full row, not just the report field\n    }\n    // Otherwise fetch all reports for the user (list view)\n    const { data, error } = await supabase.from('speech_language_reports').select('id, report').eq('user_id', userId);\n    if (error) {\n        return next_server__WEBPACK_IMPORTED_MODULE_1__.NextResponse.json({\n            error: error.message\n        }, {\n            status: 500\n        });\n    }\n    const result = data.map((entry)=>({\n            id: entry.id,\n            title: entry.report?.header?.studentInformation?.fullName ?? 'Untitled',\n            type: 'speech-language',\n            createDate: entry.report?.metadata?.createdAt ?? '',\n            updateDate: entry.report?.metadata?.lastUpdated ?? '',\n            studentName: entry.report?.header?.studentInformation?.fullName ?? '',\n            studentAge: entry.report?.header?.studentInformation?.age ?? ''\n        }));\n    return next_server__WEBPACK_IMPORTED_MODULE_1__.NextResponse.json(result);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9yZXBvcnRzL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUFxRDtBQUNWO0FBRXBDLGVBQWVFLElBQUlDLEdBQVk7SUFDcEMsTUFBTUMsTUFBTSxJQUFJQyxJQUFJRixJQUFJQyxHQUFHO0lBQzNCLE1BQU1FLFNBQVNGLElBQUlHLFlBQVksQ0FBQ0MsR0FBRyxDQUFDO0lBQ3BDLE1BQU1DLFdBQVdMLElBQUlHLFlBQVksQ0FBQ0MsR0FBRyxDQUFDLE9BQU8sMkJBQTJCO0lBRXhFLE1BQU1FLGNBQWMsTUFBTSxvV0FBc0IsQ0FBQ0MsSUFBSSxDQUFDQyxDQUFBQSxJQUFLQSxFQUFFQyxPQUFPO0lBRXBFLElBQUksQ0FBQ1AsUUFBUTtRQUNYLE9BQU9MLHFEQUFZQSxDQUFDYSxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFpQixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUN0RTtJQUVBLE1BQU1DLFdBQVcsTUFBTWpCLGtFQUFZQSxDQUFDVTtJQUVwQyxpREFBaUQ7SUFDakQsSUFBSUQsVUFBVTtRQUNaLE1BQU0sRUFBRVMsSUFBSSxFQUFFSCxLQUFLLEVBQUUsR0FBRyxNQUFNRSxTQUMzQkUsSUFBSSxDQUFDLDJCQUNMQyxNQUFNLENBQUMsS0FBSyxrQkFBa0I7U0FDOUJDLEVBQUUsQ0FBQyxNQUFNWixVQUNUWSxFQUFFLENBQUMsV0FBV2YsUUFDZGdCLE1BQU07UUFFVCxJQUFJUCxPQUFPO1lBQ1RRLFFBQVFSLEtBQUssQ0FBQyxnQ0FBZ0NBO1lBQzlDLE9BQU9kLHFEQUFZQSxDQUFDYSxJQUFJLENBQUM7Z0JBQUVDLE9BQU9BLE1BQU1TLE9BQU87WUFBQyxHQUFHO2dCQUFFUixRQUFRO1lBQUk7UUFDbkU7UUFFQSw4REFBOEQ7UUFDOURPLFFBQVFFLEdBQUcsQ0FBQyw2Q0FBNkM7WUFDdkRDLE9BQU9DLFFBQVFULE1BQU1VO1lBQ3JCQyxXQUFXRixRQUFRVCxNQUFNWTtZQUN6QkMsV0FBV0osUUFBUVQsTUFBTWM7WUFDekJDLFlBQVksT0FBT2YsTUFBTWM7WUFDekJFLGlCQUFpQlAsUUFBUVQsTUFBTWMsUUFBUUc7WUFDdkNDLHNCQUFzQlQsUUFBUVQsTUFBTWMsUUFBUUcsUUFBUUU7WUFDcERDLG1CQUFtQnBCLE1BQU1jLFFBQVFHLFFBQVFFLHFCQUN2Q0UsT0FBT0MsSUFBSSxDQUFDdEIsS0FBS2MsTUFBTSxDQUFDRyxNQUFNLENBQUNFLGtCQUFrQixJQUFJLEVBQUU7UUFDM0Q7UUFFQSx5Q0FBeUM7UUFDekNkLFFBQVFFLEdBQUcsQ0FBQyx3QkFBd0JnQixLQUFLQyxTQUFTLENBQUN4QixNQUFNLE1BQU07UUFDL0QsT0FBT2pCLHFEQUFZQSxDQUFDYSxJQUFJLENBQUNJLE9BQU8saURBQWlEO0lBQ25GO0lBRUEsdURBQXVEO0lBQ3ZELE1BQU0sRUFBRUEsSUFBSSxFQUFFSCxLQUFLLEVBQUUsR0FBRyxNQUFNRSxTQUMzQkUsSUFBSSxDQUFDLDJCQUNMQyxNQUFNLENBQUMsY0FDUEMsRUFBRSxDQUFDLFdBQVdmO0lBRWpCLElBQUlTLE9BQU87UUFDVCxPQUFPZCxxREFBWUEsQ0FBQ2EsSUFBSSxDQUFDO1lBQUVDLE9BQU9BLE1BQU1TLE9BQU87UUFBQyxHQUFHO1lBQUVSLFFBQVE7UUFBSTtJQUNuRTtJQUVBLE1BQU0yQixTQUFTekIsS0FBSzBCLEdBQUcsQ0FBQ0MsQ0FBQUEsUUFBVTtZQUNoQ2pCLElBQUlpQixNQUFNakIsRUFBRTtZQUNaa0IsT0FBT0QsTUFBTWIsTUFBTSxFQUFFRyxRQUFRRSxvQkFBb0JVLFlBQVk7WUFDN0RDLE1BQU07WUFDTkMsWUFBWUosTUFBTWIsTUFBTSxFQUFFa0IsVUFBVUMsYUFBYTtZQUNqREMsWUFBWVAsTUFBTWIsTUFBTSxFQUFFa0IsVUFBVUcsZUFBZTtZQUNuREMsYUFBYVQsTUFBTWIsTUFBTSxFQUFFRyxRQUFRRSxvQkFBb0JVLFlBQVk7WUFDbkVRLFlBQVlWLE1BQU1iLE1BQU0sRUFBRUcsUUFBUUUsb0JBQW9CbUIsT0FBTztRQUMvRDtJQUVBLE9BQU92RCxxREFBWUEsQ0FBQ2EsSUFBSSxDQUFDNkI7QUFDM0IiLCJzb3VyY2VzIjpbIi9Vc2Vycy9icmFuZG9uYnJld2VyL0RvY3VtZW50cy9MaW5ndW9zaXR5L0xpbmd1b3NpdHkvc3JjL2FwcC9hcGkvcmVwb3J0cy9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdAL2xpYi9zdXBhYmFzZS9zZXJ2ZXInO1xuaW1wb3J0IHsgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKHJlcTogUmVxdWVzdCkge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwpO1xuICBjb25zdCB1c2VySWQgPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgndXNlcklkJyk7XG4gIGNvbnN0IHJlcG9ydElkID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ2lkJyk7IC8vIG9wdGlvbmFsIHNwZWNpZmljIHJlcG9ydFxuXG4gIGNvbnN0IGNvb2tpZVN0b3JlID0gYXdhaXQgaW1wb3J0KCduZXh0L2hlYWRlcnMnKS50aGVuKG0gPT4gbS5jb29raWVzKCkpO1xuXG4gIGlmICghdXNlcklkKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdNaXNzaW5nIHVzZXJJZCcgfSwgeyBzdGF0dXM6IDQwMCB9KTtcbiAgfVxuXG4gIGNvbnN0IHN1cGFiYXNlID0gYXdhaXQgY3JlYXRlQ2xpZW50KGNvb2tpZVN0b3JlKTtcblxuICAvLyBJZiByZXBvcnRJZCBpcyBwcm92aWRlZCwgZmV0Y2ggYSBzaW5nbGUgcmVwb3J0XG4gIGlmIChyZXBvcnRJZCkge1xuICAgIGNvbnN0IHsgZGF0YSwgZXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgICAuZnJvbSgnc3BlZWNoX2xhbmd1YWdlX3JlcG9ydHMnKVxuICAgICAgLnNlbGVjdCgnKicpIC8vIFJldHVybiBmdWxsIHJvd1xuICAgICAgLmVxKCdpZCcsIHJlcG9ydElkKVxuICAgICAgLmVxKCd1c2VyX2lkJywgdXNlcklkKVxuICAgICAgLnNpbmdsZSgpO1xuXG4gICAgaWYgKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZmV0Y2hpbmcgcmVwb3J0IGJ5IElEOlwiLCBlcnJvcik7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogZXJyb3IubWVzc2FnZSB9LCB7IHN0YXR1czogNTAwIH0pO1xuICAgIH1cblxuICAgIC8vIEVuaGFuY2VkIGxvZ2dpbmcgZm9yIGJldHRlciB2aXNpYmlsaXR5IG9mIG5lc3RlZCBzdHJ1Y3R1cmVzXG4gICAgY29uc29sZS5sb2coXCJGZXRjaGVkIHJlcG9ydCAoYnkgSUQpIC0gU3RydWN0dXJlIGNoZWNrOlwiLCB7XG4gICAgICBoYXNJZDogQm9vbGVhbihkYXRhPy5pZCksXG4gICAgICBoYXNVc2VySWQ6IEJvb2xlYW4oZGF0YT8udXNlcl9pZCksXG4gICAgICBoYXNSZXBvcnQ6IEJvb2xlYW4oZGF0YT8ucmVwb3J0KSxcbiAgICAgIHJlcG9ydFR5cGU6IHR5cGVvZiBkYXRhPy5yZXBvcnQsXG4gICAgICByZXBvcnRIYXNIZWFkZXI6IEJvb2xlYW4oZGF0YT8ucmVwb3J0Py5oZWFkZXIpLFxuICAgICAgcmVwb3J0SGFzU3R1ZGVudEluZm86IEJvb2xlYW4oZGF0YT8ucmVwb3J0Py5oZWFkZXI/LnN0dWRlbnRJbmZvcm1hdGlvbiksXG4gICAgICBzdHVkZW50SW5mb0ZpZWxkczogZGF0YT8ucmVwb3J0Py5oZWFkZXI/LnN0dWRlbnRJbmZvcm1hdGlvbiA/IFxuICAgICAgICBPYmplY3Qua2V5cyhkYXRhLnJlcG9ydC5oZWFkZXIuc3R1ZGVudEluZm9ybWF0aW9uKSA6IFtdXG4gICAgfSk7XG4gICAgXG4gICAgLy8gRnVsbCBkYXRhIGR1bXAgZm9yIGNvbXBsZXRlIHZpc2liaWxpdHlcbiAgICBjb25zb2xlLmxvZyhcIkZldGNoZWQgcmVwb3J0IEpTT046XCIsIEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpKTtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oZGF0YSk7IC8vIFJldHVybiB0aGUgZnVsbCByb3csIG5vdCBqdXN0IHRoZSByZXBvcnQgZmllbGRcbiAgfVxuXG4gIC8vIE90aGVyd2lzZSBmZXRjaCBhbGwgcmVwb3J0cyBmb3IgdGhlIHVzZXIgKGxpc3QgdmlldylcbiAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAuZnJvbSgnc3BlZWNoX2xhbmd1YWdlX3JlcG9ydHMnKVxuICAgIC5zZWxlY3QoJ2lkLCByZXBvcnQnKVxuICAgIC5lcSgndXNlcl9pZCcsIHVzZXJJZCk7XG5cbiAgaWYgKGVycm9yKSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IGRhdGEubWFwKGVudHJ5ID0+ICh7XG4gICAgaWQ6IGVudHJ5LmlkLFxuICAgIHRpdGxlOiBlbnRyeS5yZXBvcnQ/LmhlYWRlcj8uc3R1ZGVudEluZm9ybWF0aW9uPy5mdWxsTmFtZSA/PyAnVW50aXRsZWQnLFxuICAgIHR5cGU6ICdzcGVlY2gtbGFuZ3VhZ2UnLFxuICAgIGNyZWF0ZURhdGU6IGVudHJ5LnJlcG9ydD8ubWV0YWRhdGE/LmNyZWF0ZWRBdCA/PyAnJyxcbiAgICB1cGRhdGVEYXRlOiBlbnRyeS5yZXBvcnQ/Lm1ldGFkYXRhPy5sYXN0VXBkYXRlZCA/PyAnJyxcbiAgICBzdHVkZW50TmFtZTogZW50cnkucmVwb3J0Py5oZWFkZXI/LnN0dWRlbnRJbmZvcm1hdGlvbj8uZnVsbE5hbWUgPz8gJycsXG4gICAgc3R1ZGVudEFnZTogZW50cnkucmVwb3J0Py5oZWFkZXI/LnN0dWRlbnRJbmZvcm1hdGlvbj8uYWdlID8/ICcnXG4gIH0pKTtcblxuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24ocmVzdWx0KTtcbn0iXSwibmFtZXMiOlsiY3JlYXRlQ2xpZW50IiwiTmV4dFJlc3BvbnNlIiwiR0VUIiwicmVxIiwidXJsIiwiVVJMIiwidXNlcklkIiwic2VhcmNoUGFyYW1zIiwiZ2V0IiwicmVwb3J0SWQiLCJjb29raWVTdG9yZSIsInRoZW4iLCJtIiwiY29va2llcyIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsInN1cGFiYXNlIiwiZGF0YSIsImZyb20iLCJzZWxlY3QiLCJlcSIsInNpbmdsZSIsImNvbnNvbGUiLCJtZXNzYWdlIiwibG9nIiwiaGFzSWQiLCJCb29sZWFuIiwiaWQiLCJoYXNVc2VySWQiLCJ1c2VyX2lkIiwiaGFzUmVwb3J0IiwicmVwb3J0IiwicmVwb3J0VHlwZSIsInJlcG9ydEhhc0hlYWRlciIsImhlYWRlciIsInJlcG9ydEhhc1N0dWRlbnRJbmZvIiwic3R1ZGVudEluZm9ybWF0aW9uIiwic3R1ZGVudEluZm9GaWVsZHMiLCJPYmplY3QiLCJrZXlzIiwiSlNPTiIsInN0cmluZ2lmeSIsInJlc3VsdCIsIm1hcCIsImVudHJ5IiwidGl0bGUiLCJmdWxsTmFtZSIsInR5cGUiLCJjcmVhdGVEYXRlIiwibWV0YWRhdGEiLCJjcmVhdGVkQXQiLCJ1cGRhdGVEYXRlIiwibGFzdFVwZGF0ZWQiLCJzdHVkZW50TmFtZSIsInN0dWRlbnRBZ2UiLCJhZ2UiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/reports/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/supabase/server.ts":
/*!************************************!*\
  !*** ./src/lib/supabase/server.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createClient: () => (/* binding */ createClient)\n/* harmony export */ });\n/* harmony import */ var _supabase_ssr__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/ssr */ \"(rsc)/./node_modules/.pnpm/@supabase+ssr@0.6.1_@supabase+supabase-js@2.49.4/node_modules/@supabase/ssr/dist/module/index.js\");\n\nasync function createClient(cookieStore) {\n    return (0,_supabase_ssr__WEBPACK_IMPORTED_MODULE_0__.createServerClient)(\"https://pvozqngxirrnrylefpmq.supabase.co\", \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2b3pxbmd4aXJybnJ5bGVmcG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDUxMDgsImV4cCI6MjA1OTMyMTEwOH0.cqxg_8C2kvToSxPRuxmJBLAv2L4QGiNsQeYLAo0nq4w\", {\n        cookies: {\n            async get (name) {\n                const cookie = await cookieStore.get(name);\n                return cookie?.value;\n            },\n            async set (name, value, options) {\n                try {\n                    cookieStore.set({\n                        name,\n                        value,\n                        ...options\n                    });\n                } catch (error) {\n                    // In production, setting cookies in middleware or server actions may throw\n                    // This is a known issue: https://github.com/vercel/next.js/issues/49259\n                    console.warn('Error setting cookie', error);\n                }\n            },\n            async remove (name, options) {\n                try {\n                    cookieStore.set({\n                        name,\n                        value: '',\n                        ...options\n                    });\n                } catch (error) {\n                    console.warn('Error removing cookie', error);\n                }\n            }\n        }\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3N1cGFiYXNlL3NlcnZlci50cyIsIm1hcHBpbmdzIjoiOzs7OztBQUFtRDtBQUs1QyxlQUFlQyxhQUFhQyxXQUFtQztJQUNwRSxPQUFPRixpRUFBa0JBLENBQ3ZCRywwQ0FBb0MsRUFDcENBLGtOQUF5QyxFQUN6QztRQUNFSSxTQUFTO1lBQ1AsTUFBTUMsS0FBSUMsSUFBWTtnQkFDcEIsTUFBTUMsU0FBUyxNQUFNUixZQUFZTSxHQUFHLENBQUNDO2dCQUNyQyxPQUFPQyxRQUFRQztZQUNqQjtZQUNBLE1BQU1DLEtBQUlILElBQVksRUFBRUUsS0FBYSxFQUFFRSxPQUFZO2dCQUNqRCxJQUFJO29CQUNGWCxZQUFZVSxHQUFHLENBQUM7d0JBQUVIO3dCQUFNRTt3QkFBTyxHQUFHRSxPQUFPO29CQUFDO2dCQUM1QyxFQUFFLE9BQU9DLE9BQU87b0JBQ2QsMkVBQTJFO29CQUMzRSx3RUFBd0U7b0JBQ3hFQyxRQUFRQyxJQUFJLENBQUMsd0JBQXdCRjtnQkFDdkM7WUFDRjtZQUNBLE1BQU1HLFFBQU9SLElBQVksRUFBRUksT0FBWTtnQkFDckMsSUFBSTtvQkFDRlgsWUFBWVUsR0FBRyxDQUFDO3dCQUFFSDt3QkFBTUUsT0FBTzt3QkFBSSxHQUFHRSxPQUFPO29CQUFDO2dCQUNoRCxFQUFFLE9BQU9DLE9BQU87b0JBQ2RDLFFBQVFDLElBQUksQ0FBQyx5QkFBeUJGO2dCQUN4QztZQUNGO1FBQ0Y7SUFDRjtBQUVKIiwic291cmNlcyI6WyIvVXNlcnMvYnJhbmRvbmJyZXdlci9Eb2N1bWVudHMvTGluZ3Vvc2l0eS9MaW5ndW9zaXR5L3NyYy9saWIvc3VwYWJhc2Uvc2VydmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZVNlcnZlckNsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9zc3InO1xuaW1wb3J0IHsgY29va2llcyB9IGZyb20gJ25leHQvaGVhZGVycyc7XG5pbXBvcnQgeyBSZWFkb25seVJlcXVlc3RDb29raWVzIH0gZnJvbSAnbmV4dC9kaXN0L3NlcnZlci93ZWIvc3BlYy1leHRlbnNpb24vYWRhcHRlcnMvcmVxdWVzdC1jb29raWVzJztcbmltcG9ydCB7IERhdGFiYXNlIH0gZnJvbSAnQC90eXBlcy9zdXBhYmFzZVR5cGVzJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUNsaWVudChjb29raWVTdG9yZTogUmVhZG9ubHlSZXF1ZXN0Q29va2llcykge1xuICByZXR1cm4gY3JlYXRlU2VydmVyQ2xpZW50PERhdGFiYXNlPihcbiAgICBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwhLFxuICAgIHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZISxcbiAgICB7XG4gICAgICBjb29raWVzOiB7XG4gICAgICAgIGFzeW5jIGdldChuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgICBjb25zdCBjb29raWUgPSBhd2FpdCBjb29raWVTdG9yZS5nZXQobmFtZSk7XG4gICAgICAgICAgcmV0dXJuIGNvb2tpZT8udmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIGFzeW5jIHNldChuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcsIG9wdGlvbnM6IGFueSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb29raWVTdG9yZS5zZXQoeyBuYW1lLCB2YWx1ZSwgLi4ub3B0aW9ucyB9KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gSW4gcHJvZHVjdGlvbiwgc2V0dGluZyBjb29raWVzIGluIG1pZGRsZXdhcmUgb3Igc2VydmVyIGFjdGlvbnMgbWF5IHRocm93XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGEga25vd24gaXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS92ZXJjZWwvbmV4dC5qcy9pc3N1ZXMvNDkyNTlcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRXJyb3Igc2V0dGluZyBjb29raWUnLCBlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBhc3luYyByZW1vdmUobmFtZTogc3RyaW5nLCBvcHRpb25zOiBhbnkpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29va2llU3RvcmUuc2V0KHsgbmFtZSwgdmFsdWU6ICcnLCAuLi5vcHRpb25zIH0pO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0Vycm9yIHJlbW92aW5nIGNvb2tpZScsIGVycm9yKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH1cbiAgKTtcbn0iXSwibmFtZXMiOlsiY3JlYXRlU2VydmVyQ2xpZW50IiwiY3JlYXRlQ2xpZW50IiwiY29va2llU3RvcmUiLCJwcm9jZXNzIiwiZW52IiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMIiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVkiLCJjb29raWVzIiwiZ2V0IiwibmFtZSIsImNvb2tpZSIsInZhbHVlIiwic2V0Iiwib3B0aW9ucyIsImVycm9yIiwiY29uc29sZSIsIndhcm4iLCJyZW1vdmUiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/supabase/server.ts\n");

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
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1","vendor-chunks/tr46@0.0.3","vendor-chunks/@supabase+auth-js@2.69.1","vendor-chunks/@supabase+realtime-js@2.11.2","vendor-chunks/@opentelemetry+api@1.9.0","vendor-chunks/@supabase+postgrest-js@1.19.4","vendor-chunks/@supabase+node-fetch@2.6.15","vendor-chunks/whatwg-url@5.0.0","vendor-chunks/@supabase+storage-js@2.7.1","vendor-chunks/@supabase+ssr@0.6.1_@supabase+supabase-js@2.49.4","vendor-chunks/@supabase+supabase-js@2.49.4","vendor-chunks/cookie@1.0.2","vendor-chunks/@supabase+functions-js@2.4.4","vendor-chunks/webidl-conversions@3.0.1"], () => (__webpack_exec__("(rsc)/./node_modules/.pnpm/next@15.2.2_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Freports%2Froute&page=%2Fapi%2Freports%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Freports%2Froute.ts&appDir=%2FUsers%2Fbrandonbrewer%2FDocuments%2FLinguosity%2FLinguosity%2Fsrc%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fbrandonbrewer%2FDocuments%2FLinguosity%2FLinguosity&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();