import { Suspense, lazy } from "react";

import {

 BrowserRouter,

 Routes,

 Route,

 Navigate,

 useNavigate

} from "react-router-dom";

const LoginPage = lazy(

 () => import("mfe_auth/LoginPage")

);

const ReportsApp = lazy(

 () => import("mfe_report/App")

);

function PrivateRoute({ children }) {

 const token = localStorage.getItem("token");

 return token

  ? children

  : <Navigate to="/login" replace />;

}

function LoginPageWrapper() {

 const navigate = useNavigate();

 const token = localStorage.getItem("token");

 if (token) return <Navigate to="/" replace />;

 return (

  <LoginPage

   onLogin={() => navigate("/")}

  />

 );

}

function Dashboard() {

 return (

  <div style={{ padding:32 }}>

   <h1>Chave</h1>

   <div>

    <button

      onClick={() =>

        window.location.href="/"

      }

    >

      Home

    </button>

    <button

      onClick={() =>

        window.location.href="/reports/dashboard"

      }

    >

      Relatórios

    </button>

    <button

      onClick={() => {

        localStorage.clear();

        window.location.href="/login";

      }}

    >

      Sair

    </button>

   </div>

  </div>

 );

}

export default function App() {

 return (

  <BrowserRouter>

   <Suspense

     fallback={<p>Carregando...</p>}

   >

    <Routes>

    <Route

      path="/login"

      element={<LoginPageWrapper />}

    />

    <Route

      path="/"

      element={

      <PrivateRoute>

     <Dashboard />

    </PrivateRoute>

    }

/>

    <Route

      path="/reports/*"

      element={

      <PrivateRoute>

        <ReportsApp />

      </PrivateRoute>

    }

/>

    </Routes>

   </Suspense>

  </BrowserRouter>

 );

}