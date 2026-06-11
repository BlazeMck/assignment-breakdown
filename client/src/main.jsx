import { createRoot } from 'react-dom/client'
import Signup from './pages/Signup.jsx'
import './index.css'



createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
)
