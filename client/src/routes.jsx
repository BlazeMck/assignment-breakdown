import { index, route } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default [
    index("./pages/Welcome.jsx"),
    route("./pages/Signup.jsx", "/signup"),

    ...(await flatRoutes()),
];