import { useState, useEffect } from 'react';
import { AlertCircle, Users, User, Heart, Clock, CheckCircle, Mail, Lock, LogOut } from 'lucide-react';
import './index.css';
import * as api from './services/api';

// --- Interfaces ---
interface UserProfile {
  id: number;
  name: string;
  email: string;
  gender: string;
  age: string;
  rol_activo: 'voluntario' | 'solicitante';
  type: 'user' | 'volunteer';
}

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  icon: string;
  color: string;
}

interface HelpRequest {
  id: number;
  userName: string;
  userGender: string;
  userAge: string;
  category: string;
  description: string;
  location: Location;
  timestamp: string;
  status: 'pending' | 'accepted' | 'completed';
  volunteer: string | null;
  solicitante_id?: number;
  voluntario_id?: number | null;
}

const App = () => {
  // Estados
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authStep, setAuthStep] = useState<'register' | 'login' | 'selectRole' | 'dashboard'>('register');
  const [registerForm, setRegisterForm] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    edad: '',
    genero: ''
  });
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  // Estados para errores en línea (feedback inmediato)
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [tempUserId, setTempUserId] = useState<number | null>(null);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([]);
  const [myHelps, setMyHelps] = useState<HelpRequest[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({ category: '', description: '' });
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const predefinedLocations: Location[] = [
    { id: 'loc1', name: 'Punto Vuela', lat: 36.87617075381733, lng: -5.045460278303508, icon: '🏢', color: 'blue' }
  ];

  const helpCategories = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'redes', label: 'Redes Sociales', icon: '📱' },
    { id: 'correo', label: 'Correo Electrónico', icon: '📧' },
    { id: 'videollamada', label: 'Videollamada', icon: '📹' },
    { id: 'cita-previa', label: 'Cita Previa', icon: '📅' },
    { id: 'documentos', label: 'Documentos', icon: '📄' }
  ];

  // Cargar usuario de localStorage
  useEffect(() => {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      const profile = JSON.parse(saved);
      setUserProfile(profile);
      setAuthStep('dashboard');
    }
  }, []);

  // Cargar solicitudes cuando hay usuario
  useEffect(() => {
    if (userProfile) {
      loadTrayectos();
    }
  }, [userProfile]);

  const loadTrayectos = async () => {
    try {
      const trayectos = await api.obtenerTrayectos();
      const mappedRequests = trayectos.map((t: any) => {
        let status: 'pending' | 'accepted' | 'completed' = 'pending';
        if (t.estado === 'ACEPTADO') status = 'accepted';
        else if (t.estado === 'COMPLETADO') status = 'completed';

        return {
          id: t.id,
          userName: t.solicitante?.nombre_completo || 'Usuario',
          userGender: t.solicitante?.genero || 'N/A',
          userAge: t.solicitante?.edad?.toString() || 'N/A',
          category: t.titulo,
          description: t.descripcion,
          location: JSON.parse(t.ubicacion_origen || '{}'),
          timestamp: new Date(t.fecha_creacion).toLocaleString('es-ES'),
          status,
          volunteer: t.voluntario?.nombre_completo || null,
          solicitante_id: t.solicitante_id,
          voluntario_id: t.voluntario_id
        };
      });

      setHelpRequests(mappedRequests);

      if (userProfile?.id) {
        setMyRequests(mappedRequests.filter((r: HelpRequest) => r.solicitante_id === userProfile.id));
        setMyHelps(mappedRequests.filter((r: HelpRequest) => r.voluntario_id === userProfile.id));
      }
    } catch (error) {
      console.error('Error loading trayectos:', error);
    }
  };

  // Manejar Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginForm.email || !loginForm.password) {
      setLoginError('Por favor completa todos los campos');
      return;
    }

    try {
      const usuario = await api.login(loginForm);

      // SIEMPRE llevamos al usuario a seleccionar rol
      setTempUserId(usuario.id!);

      // Rellenamos registerForm para que SelectRole funcione
      setRegisterForm({
        nombre_completo: usuario.nombre_completo || '',
        email: usuario.email || '',
        password: '',
        edad: usuario.edad?.toString() || '',
        genero: usuario.genero || ''
      });

      setAuthStep('selectRole');

    } catch (error: any) {
      console.error('Error login:', error);
      if (error.status === 401 || error.status === 404) {
        setLoginError('Contraseña o correo incorrectos');
      } else {
        setLoginError(error.message || 'Error al iniciar sesión');
      }
    }
  };


  // Manejar registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { nombre_completo, email, password, edad, genero } = registerForm;

    setRegisterError(null); // Limpiar errores previos

    if (!nombre_completo || !email || !password || !edad || !genero) {
      setRegisterError('Por favor completa todos los campos');
      return;
    }

    // Validar dominio
    const emailLower = email.toLowerCase();
    if (!emailLower.endsWith('@gmail.com') && !emailLower.endsWith('@outlook.com')) {
      setRegisterError('Solo se permiten correos @gmail.com o @outlook.com');
      return;
    }

    try {
      const usuario = await api.register({
        nombre_completo,
        email,
        password,
        edad: parseInt(edad),
        genero
      });

      setTempUserId(usuario.id);
      setAuthStep('selectRole');
    } catch (error: any) {
      console.error('Error al registrar:', error);
      if (error.status === 400 || (error.message && error.message.includes('duplicado'))) {
        setRegisterError('Este correo ya está registrado. Por favor inicia sesión.');
      } else {
        setRegisterError(error.message || 'Error al registrar usuario');
      }
    }
  };

  // Seleccionar rol
  const handleSelectRole = async (rol: 'voluntario' | 'solicitante') => {
    if (!tempUserId) return;

    try {
      await api.updateUserRol(tempUserId, rol);

      const profile: UserProfile = {
        id: tempUserId,
        name: registerForm.nombre_completo,
        email: registerForm.email,
        gender: registerForm.genero,
        age: registerForm.edad,
        rol_activo: rol,
        type: rol === 'voluntario' ? 'volunteer' : 'user'
      };

      setUserProfile(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
      setAuthStep('dashboard');
    } catch (error) {
      console.error('Error al seleccionar rol:', error);
      alert('Error al seleccionar rol');
    }
  };

  // Crear solicitud
  const createHelpRequest = async () => {
    if (!userProfile?.id || !selectedLocationId || !requestData.category || !requestData.description) {
      alert('Por favor completa todos los campos');
      return;
    }

    const selectedLoc = predefinedLocations.find(loc => loc.id === selectedLocationId);
    if (!selectedLoc) return;

    try {
      await api.crearTrayecto({
        solicitante_id: userProfile.id,
        titulo: requestData.category,
        descripcion: requestData.description,
        ubicacion_origen: JSON.stringify(selectedLoc),
        ubicacion_destino: '',
        fecha_necesaria: new Date().toISOString(),
        estado: 'PENDIENTE'
      });

      await loadTrayectos();
      setRequestData({ category: '', description: '' });
      setSelectedLocationId(null);
      setShowRequestForm(false);
      alert('¡Solicitud creada exitosamente!');
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Error al crear la solicitud');
    }
  };

  // Aceptar ayuda
  const acceptHelp = async (requestId: number) => {
    if (!userProfile?.id) return;

    const activeHelps = myHelps.filter(h => h.status === 'accepted');
    if (activeHelps.length > 0) {
      alert('Ya tienes una ayuda activa. Debes completarla antes de aceptar otra.');
      return;
    }

    try {
      await api.actualizarTrayecto(requestId, {
        estado: 'ACEPTADO',
        voluntario_id: userProfile.id
      } as any);

      await loadTrayectos();
      alert('¡Has aceptado la ayuda!');
    } catch (error) {
      console.error('Error accepting help:', error);
      alert('Error al aceptar la ayuda');
    }
  };

  // Completar ayuda
  const completeHelp = async (requestId: number) => {
    try {
      await api.actualizarTrayecto(requestId, { estado: 'COMPLETADO' } as any);
      await loadTrayectos();
      alert('¡Ayuda marcada como completada!');
    } catch (error) {
      console.error('Error completing help:', error);
      alert('Error al completar la ayuda');
    }
  };

  const logout = () => {
    localStorage.removeItem('userProfile');
    setUserProfile(null);
    setAuthStep('register');
    setRegisterForm({
      nombre_completo: '',
      email: '',
      password: '',
      edad: '',
      genero: ''
    });
    setTempUserId(null);
    setHelpRequests([]);
    setMyRequests([]);
    setMyHelps([]);
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = helpCategories.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.label}` : categoryId;
  };

  // ===== PANTALLAS =====

  // Pantalla de registro
  if (authStep === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
        <div className="max-w-md mx-auto pt-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <img src="./src/assets/Logo Punto Vuela.jpg" width="100px" alt="Punto Vuela" className="mx-auto block mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Voluntarios Digitales Punto Vuela</h1>
              <p className="text-gray-600">Crea tu cuenta para comenzar</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
                <input
                  type="text"
                  value={registerForm.nombre_completo}
                  onChange={(e) => setRegisterForm({ ...registerForm, nombre_completo: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Edad</label>
                  <input
                    type="number"
                    value={registerForm.edad}
                    onChange={(e) => setRegisterForm({ ...registerForm, edad: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Edad"
                    min="1"
                    max="120"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Género</label>
                  <select
                    value={registerForm.genero}
                    onChange={(e) => setRegisterForm({ ...registerForm, genero: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Mensaje de error (Registro) */}
              {registerError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center font-bold animate-pulse">
                  {registerError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                Crear Cuenta
              </button>

              <div className="text-center mt-4">
                <p className="text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthStep('login')}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Inicia Sesión
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de Login
  if (authStep === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
        <div className="max-w-md mx-auto pt-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <img src="./src/assets/Logo Punto Vuela.jpg" width="100px" alt="Punto Vuela" className="mx-auto block mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido de nuevo</h1>
              <p className="text-gray-600">Inicia sesión para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Tu contraseña"
                    required
                  />
                </div>
              </div>

              {/* Mensaje de error (Login) */}
              {loginError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center font-bold animate-pulse">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg"
              >
                Iniciar Sesión
              </button>

              <div className="text-center mt-4">
                <p className="text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthStep('register')}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Regístrate
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de selección de rol
  if (authStep === 'selectRole') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
        <div className="max-w-md mx-auto pt-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <img src="./src/assets/Logo Punto Vuela.jpg" width="100px" alt="Punto Vuela" className="mx-auto block mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Cuenta creada con éxito!</h2>
              <p className="text-gray-600">¿Cómo quieres usar la plataforma?</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleSelectRole('solicitante')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                <User className="w-5 h-5" />
                Necesito Ayuda
              </button>

              <button
                onClick={() => handleSelectRole('voluntario')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                <Users className="w-5 h-5" />
                Soy Voluntario
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard para Usuario (necesita ayuda)
  if (userProfile && userProfile.type === 'user') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header con botón de logout */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Hola, {userProfile.name}</h2>
                <p className="text-gray-600">{userProfile.gender} • {userProfile.age} años • Usuario</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={() => setShowRequestForm(!showRequestForm)}
              className="w-full bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <AlertCircle className="w-5 h-5" />
              Solicitar Ayuda
            </button>
          </div>

          {showRequestForm && (
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-700">
              <h3 className="font-semibold text-white mb-4 text-xl">Nueva Solicitud de Ayuda</h3>

              <div className="mb-4">
                <label className="block text-gray-300 mb-2">¿En qué necesitas ayuda?</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {helpCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setRequestData({ ...requestData, category: cat.id })}
                      className={`p-3 rounded-lg font-medium transition-all ${requestData.category === cat.id
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Describe tu solicitud</label>
                <textarea
                  value={requestData.description}
                  onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
                  rows={3}
                  placeholder="Explica brevemente lo que necesitas..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-300 mb-2">Ubicación</label>
                <div className="grid grid-cols-1 gap-2">
                  {predefinedLocations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`p-3 rounded-lg font-medium transition-all ${selectedLocationId === loc.id
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                    >
                      {loc.icon} {loc.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={createHelpRequest}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-lg font-semibold transition-all"
              >
                Enviar Solicitud
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Mis Solicitudes</h3>
            {myRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No has creado ninguna solicitud aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map(req => (
                  <div key={req.id} className="border border-gray-700 bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-600 text-white">
                            {getCategoryLabel(req.category)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${req.status === 'pending' ? 'bg-yellow-600 text-white' :
                            req.status === 'accepted' ? 'bg-green-600 text-white' :
                              'bg-gray-600 text-white'
                            }`}>
                            {req.status === 'pending' ? 'Pendiente' : req.status === 'accepted' ? 'Aceptada' : 'Completada'}
                          </span>
                        </div>
                        <p className="text-white text-sm mb-2">{req.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {req.timestamp}
                          </span>
                          {req.location && (
                            <span className="font-medium">{req.location.name}</span>
                          )}
                        </div>
                        {req.volunteer && (
                          <div className="mt-2 text-sm text-green-400">
                            ✓ Voluntario: {req.volunteer}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard para Voluntario
  if (userProfile && userProfile.type === 'volunteer') {
    const pendingRequests = helpRequests.filter(req => req.status === 'pending');
    const hasActiveHelp = myHelps.filter(h => h.status === 'accepted').length > 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header con botón de logout */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Hola, {userProfile.name}</h2>
                <p className="text-gray-600">{userProfile.gender} • {userProfile.age} años • Voluntario</p>
              </div>
            </div>
          </div>

          {hasActiveHelp && (
            <div className="bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 font-semibold">
                ⚠️ Ya tienes una ayuda activa. Complétala antes de aceptar otra solicitud.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-4 border-yellow-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Solicitudes de Ayuda Activas</h3>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay solicitudes de ayuda en este momento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="border-2 border-gray-300 rounded-lg p-4 transition-all hover:border-yellow-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-black">
                            {getCategoryLabel(req.category)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {req.userGender}, {req.userAge} años
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{req.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {req.timestamp}
                          </span>
                          {req.location && (
                            <span className="flex items-center gap-1">
                              🏢 <span className="font-medium">{req.location.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => acceptHelp(req.id)}
                        disabled={hasActiveHelp}
                        className={`ml-4 px-6 py-3 rounded-lg font-semibold transition-all ${hasActiveHelp
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-yellow-500 hover:bg-yellow-600 text-black transform hover:scale-105'
                          }`}
                      >
                        Voy en Camino
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Mis Ayudas</h3>
            {myHelps.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No has aceptado ninguna ayuda aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myHelps.map(help => (
                  <div key={help.id} className="border-2 border-green-500 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-600 text-white">
                            {getCategoryLabel(help.category)}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${help.status === 'accepted' ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-white'
                            }`}>
                            {help.status === 'accepted' ? 'En Progreso' : 'Completada'}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{help.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Usuario: {help.userName}</span>
                          {help.location && (
                            <span className="flex items-center gap-1">
                              🏢 <span className="font-medium">{help.location.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      {help.status === 'accepted' && (
                        <button
                          onClick={() => completeHelp(help.id)}
                          className="ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                        >
                          <CheckCircle className="w-5 h-5 inline mr-2" />
                          Marcar como Completada
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default App;