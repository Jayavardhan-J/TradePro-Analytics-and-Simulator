/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- Important: Ensure this line exists
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}