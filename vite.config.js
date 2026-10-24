import { defineConfig } from "vite";
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        login: "login.html",
        register: "register.html",
        dashboard: "dashboard/index.html",
        websiteBuilder: "dashboard/website-builder.html",
        site: "site.html"
      }
    }
  }
});
