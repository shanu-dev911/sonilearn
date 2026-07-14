const config = {

    content: [

        "./app/**/*.{js,ts,jsx,tsx,mdx}",

        "./pages/**/*.{js,ts,jsx,tsx,mdx}",

        "./components/**/*.{js,ts,jsx,tsx,mdx}",

    ],

    theme: {

        extend: {

            animation: {

                float: "float 6s ease-in-out infinite",

                fadeIn: "fadeIn 1s ease-in-out",

                slideUp: "slideUp 0.6s ease-out",

            },

            keyframes: {

                float: {

                    "0%, 100%": {
                        transform: "translateY(0px)",
                    },

                    "50%": {
                        transform: "translateY(-10px)",
                    },

                },

                fadeIn: {

                    "0%": {
                        opacity: 0,
                    },

                    "100%": {
                        opacity: 1,
                    },

                },

                slideUp: {

                    "0%": {
                        transform: "translateY(30px)",
                        opacity: 0,
                    },

                    "100%": {
                        transform: "translateY(0px)",
                        opacity: 1,
                    },

                },

            },

            boxShadow: {

                soft: "0 4px 20px rgba(0,0,0,0.08)",

                card: "0 2px 10px rgba(0,0,0,0.06)",

            },

            borderRadius: {

                xl2: "1.5rem",

                xl3: "2rem",

            },

            colors: {

                primary: "#2563eb",

                success: "#16a34a",

                danger: "#dc2626",

            },

        },

    },

    plugins: [],

};

export default config;