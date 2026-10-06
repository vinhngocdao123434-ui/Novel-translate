/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "830d98168c7cebf3d235173e4a975844"
  }, {
    "url": "pwa-512x512.png",
    "revision": "25ec478bc0b78007426577ce8ebcf953"
  }, {
    "url": "pwa-192x192.png",
    "revision": "2e361ab7e9f62d41f0773398cb3fde1b"
  }, {
    "url": "index.html",
    "revision": "cdddc1626ce39e2ba152761fcebb9fff"
  }, {
    "url": "icon.svg",
    "revision": "a901b6a9d510d8790f5df9f87aa4900c"
  }, {
    "url": "favicon.ico",
    "revision": "95ea68860e06ee5cecff8872a4983c0f"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "eb46bda92d9cf88eec35061518de1462"
  }, {
    "url": "assets/index-BcWkpwCd.js",
    "revision": null
  }, {
    "url": "assets/index-BJ0ZDTXs.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "eb46bda92d9cf88eec35061518de1462"
  }, {
    "url": "favicon.ico",
    "revision": "95ea68860e06ee5cecff8872a4983c0f"
  }, {
    "url": "icon.svg",
    "revision": "a901b6a9d510d8790f5df9f87aa4900c"
  }, {
    "url": "pwa-192x192.png",
    "revision": "2e361ab7e9f62d41f0773398cb3fde1b"
  }, {
    "url": "pwa-512x512.png",
    "revision": "25ec478bc0b78007426577ce8ebcf953"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "830d98168c7cebf3d235173e4a975844"
  }, {
    "url": "manifest.webmanifest",
    "revision": "2583ff1710ae9b79228b48b945bc9791"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
