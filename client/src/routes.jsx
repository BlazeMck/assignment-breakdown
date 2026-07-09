import { index, route } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";

export default [
    index("./pages/Welcome.jsx"),
    route("/signup", "./pages/Signup.jsx"),
    
    route("/assignments/:id", "./pages/AssignmentView.jsx"),

    ...(await flatRoutes()),
];