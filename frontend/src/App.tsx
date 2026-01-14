import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Users, User, Heart, Clock, CheckCircle, Mail, Lock, LogOut, MessageSquare, Send } from 'lucide-react';
import './index.css';
import * as api from './services/api';
import logoPuntoVuela from './assets/Logo Punto Vuela.jpg';

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
  status: 'pending' | 'accepted' | 'completed' | 'expired';
  volunteer: string | null;
  solicitante_id?: number;
  voluntario_id?: number | null;
  createdAt: string;
  confirmacion_solicitante?: boolean;
  confirmacion_voluntario?: boolean;
}

interface RankingEntry {
  posicion: number;
  id: number;
  nombre: string;
  localidad: string;
  ayudas_completadas: number;
}

interface ModalConfig {
  title: string;
  message: string;
  type: 'success' | 'alert' | 'error' | 'confirm';
  onConfirm?: () => void;
}

interface ModalState extends ModalConfig {
  isOpen: boolean;
}

const CountdownTimer = ({ timestamp }: { timestamp: string }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(timestamp).getTime();
      const end = start + 30 * 60 * 1000;
      const now = new Date().getTime();
      const diff = end - now;
      return diff > 0 ? diff : 0;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timestamp]);

  if (timeLeft <= 0) return <span className="text-red-600 font-bold">Expirado</span>;

  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <div className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full font-mono font-bold text-sm animate-pulse border border-red-200">
      <Clock className="w-4 h-4" />
      {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
    </div>
  );
};

const App = () => {
  // Estados

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authStep, setAuthStep] = useState<'register' | 'login' | 'dashboard' | 'verificationSent' | 'forgotPassword' | 'resetPassword' | 'howItWorks'>('register');
  const [registerForm, setRegisterForm] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    edad: '',
    genero: '',
    localidad: '',
    rol: 'solicitante' as 'voluntario' | 'solicitante'
  });
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Estados para recuperación de contraseña
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Estados para errores en línea (feedback inmediato)
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);


  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([]);
  const [myHelps, setMyHelps] = useState<HelpRequest[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({ category: '', description: '' });
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Estado para el modal personalizado
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const showAlert = (title: string, message: string, type: 'success' | 'alert' | 'error' = 'alert') => {
    setModal({ isOpen: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModal({ isOpen: true, title, message, type: 'confirm', onConfirm });
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const CustomModal = () => {
    if (!modal.isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 border-t-8 border-yellow-500 animate-in zoom-in slide-in-from-bottom-4 duration-300 text-center">
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 rotate-3 shadow-lg ${modal.type === 'success' ? 'bg-green-100 text-green-600' :
            modal.type === 'error' ? 'bg-red-100 text-red-600' :
              'bg-yellow-100 text-yellow-600'
            }`}>
            {modal.type === 'success' ? <CheckCircle className="w-8 h-8" /> :
              modal.type === 'error' ? <AlertCircle className="w-8 h-8" /> :
                <AlertCircle className="w-8 h-8" />}
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{modal.title}</h2>
          <p className="text-gray-600 font-medium mb-8 leading-relaxed">{modal.message}</p>

          <div className={`grid gap-3 ${modal.type === 'confirm' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {modal.type === 'confirm' && (
              <button
                onClick={closeModal}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold transition-all active:scale-95"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={() => {
                if (modal.onConfirm) modal.onConfirm();
                closeModal();
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-yellow-100 transition-all transform hover:scale-105 active:scale-90"
            >
              {modal.type === 'confirm' ? 'Confirmar' : 'Entendido'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const predefinedLocations: Location[] = [
    { id: 'loc1', name: 'Punto Vuela', lat: 37.2965, lng: -1.8687, icon: '💻', color: 'blue' },
    { id: 'loc2', name: 'Puerta Colegio', lat: 37.2970, lng: -1.8690, icon: '🏫', color: 'purple' },
    { id: 'loc3', name: 'El Nacimiento', lat: 37.2980, lng: -1.8680, icon: '🏞️', color: 'green' }
  ];

  const helpCategories = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'redes', label: 'Redes Sociales', icon: '📱' },
    { id: 'correo', label: 'Correo Electrónico', icon: '📧' },
    { id: 'videollamada', label: 'Videollamada', icon: '📹' },
    { id: 'cita-previa', label: 'Cita Previa', icon: '📅' },
    { id: 'documentos', label: 'Documentos', icon: '📄' }
  ];

  // Cargar usuario de localStorage y verificar token de URL
  useEffect(() => {
    // 1. Check URL for reset token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      setResetToken(token);
      setAuthStep('resetPassword');
      // Limpiar URL para que no se vea feo
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      // 2. Check localStorage if no token
      const saved = localStorage.getItem('userProfile');
      if (saved) {
        const profile = JSON.parse(saved);
        setUserProfile(profile);
        setAuthStep('dashboard');
      }
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
        let status: 'pending' | 'accepted' | 'completed' | 'expired' = 'pending';
        if (t.estado === 'ACEPTADO') status = 'accepted';
        else if (t.estado === 'COMPLETADO') status = 'completed';
        else if (t.estado === 'EXPIRADO') status = 'expired';

        let locationData = { name: t.ubicacion_origen || 'No especificada', icon: '📍' };
        try {
          if (t.ubicacion_origen && (t.ubicacion_origen.startsWith('{') || t.ubicacion_origen.startsWith('['))) {
            locationData = JSON.parse(t.ubicacion_origen);
          }
        } catch (e) {
          console.error('Error parsing location for request', t.id, e);
        }

        return {
          id: t.id,
          userName: t.solicitante?.nombre_completo || 'Usuario',
          userGender: t.solicitante?.genero || 'N/A',
          userAge: t.solicitante?.edad?.toString() || 'N/A',
          category: t.titulo,
          description: t.descripcion,
          location: locationData,
          timestamp: new Date(t.fecha_creacion).toLocaleString('es-ES'),
          status,
          volunteer: t.voluntario?.nombre_completo || null,
          solicitante_id: t.solicitante_id,
          voluntario_id: t.voluntario_id,
          createdAt: t.fecha_creacion,
          confirmacion_solicitante: t.confirmacion_solicitante,
          confirmacion_voluntario: t.confirmacion_voluntario
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

      // Iniciar sesión directamente con el rol del usuario
      const profile: UserProfile = {
        id: usuario.id!,
        name: usuario.nombre_completo!,
        email: usuario.email!,
        rol_activo: usuario.rol_activo as 'voluntario' | 'solicitante',
        type: usuario.rol_activo === 'voluntario' ? 'volunteer' : 'user',
        gender: usuario.genero!,
        age: usuario.edad?.toString() || ''
      };

      setUserProfile(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
      setAuthStep('dashboard');

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
    const { nombre_completo, email, password, edad, genero, localidad } = registerForm;

    setRegisterError(null); // Limpiar errores previos

    if (!nombre_completo || !email || !password || !edad || !genero || !localidad) {
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
      await api.register({
        nombre_completo,
        email,
        password,
        edad: parseInt(edad),
        genero,
        localidad,
        rol: registerForm.rol
      });

      // setTempUserId(usuario.id); 
      // Ya no pasamos directo, pedimos verificación
      setAuthStep('verificationSent');
    } catch (error: any) {
      console.error('Error al registrar:', error);
      if (error.status === 400 || (error.message && error.message.includes('duplicado'))) {
        setRegisterError('Este correo ya está registrado. Por favor inicia sesión.');
      } else {
        setRegisterError(error.message || 'Error al registrar usuario');
      }
    }
  };



  // Crear solicitud
  const createHelpRequest = async () => {
    if (!userProfile?.id || !selectedLocationId || !requestData.category || !requestData.description) {
      showAlert('Datos incompletos', 'Por favor completa todos los campos para que los voluntarios puedan ayudarte mejor.', 'alert');
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
      showAlert('¡Solicitud Enviada!', 'Tu solicitud se ha creado correctamente. Un voluntario te contactará pronto.', 'success');
    } catch (error) {
      console.error('Error creating request:', error);
      showAlert('Error', 'No se pudo crear la solicitud. Por favor, inténtalo de nuevo.', 'error');
    }
  };

  // Aceptar ayuda
  const acceptHelp = async (requestId: number) => {
    if (!userProfile?.id) return;

    const activeHelps = myHelps.filter(h => h.status === 'accepted');
    if (activeHelps.length > 0) {
      showAlert('Ayuda Activa', 'Ya tienes una ayuda activa. Debes completarla antes de aceptar otra.', 'alert');
      return;
    }

    try {
      await api.actualizarTrayecto(requestId, {
        estado: 'ACEPTADO',
        voluntario_id: userProfile.id
      } as any);

      await loadTrayectos();
      showAlert('¡Ayuda Aceptada!', 'Has aceptado la solicitud. ¡Gracias por tu valiosa ayuda!', 'success');
    } catch (error) {
      console.error('Error accepting help:', error);
      showAlert('Error', 'No se pudo aceptar la ayuda. Por favor, inténtalo de nuevo.', 'error');
    }
  };

  // Confirmar por parte del Voluntario (Completar)
  const completeHelp = async (requestId: number) => {
    try {
      await api.actualizarTrayecto(requestId, { confirmacion_voluntario: true } as any);
      await loadTrayectos();
      showAlert('¡Petición enviada!', 'Has marcado la ayuda como completada. Esperando a que el solicitante confirme también.', 'success');
    } catch (error) {
      console.error('Error completing help:', error);
      showAlert('Error', 'No se pudo completar la ayuda. Por favor, inténtalo de nuevo.', 'error');
    }
  };

  // Confirmar por parte del Solicitante (Han llegado)
  const confirmArrival = async (requestId: number) => {
    showConfirm(
      '¿Han llegado a ayudarte?',
      'Confirma si el voluntario ya está contigo o te ha ayudado con lo que necesitabas.',
      async () => {
        try {
          await api.actualizarTrayecto(requestId, { confirmacion_solicitante: true } as any);
          await loadTrayectos();
          showAlert('¡Gracias por confirmar!', 'Tu confirmación ha sido registrada. ¡Esperamos que la ayuda te sea de utilidad!', 'success');
        } catch (error) {
          console.error('Error confirming arrival:', error);
          showAlert('Error', 'No se pudo registrar la confirmación. Inténtalo de nuevo.', 'error');
        }
      }
    );
  };

  // Cancelar ayuda (Voluntario)
  const cancelHelp = async (requestId: number) => {
    showConfirm(
      '¿Cancelar esta ayuda?',
      'Si cancelas, la solicitud volverá a estar pendiente para que otros voluntarios puedan aceptarla.',
      async () => {
        try {
          await api.actualizarTrayecto(requestId, {
            estado: 'PENDIENTE',
            voluntario_id: null,
            fecha_creacion: new Date().toISOString() // Reiniciar el temporizador de 30 mins
          } as any);
          await loadTrayectos();
          showAlert('Ayuda Cancelada', 'La solicitud ha vuelto al estado pendiente.', 'success');
        } catch (error) {
          console.error('Error canceling help:', error);
          showAlert('Error', 'No se pudo cancelar la ayuda. Inténtalo de nuevo.', 'error');
        }
      }
    );
  };

  // Eliminar solicitud (Solicitante)
  const deleteHelpRequest = async (requestId: number) => {
    showConfirm(
      '¿Eliminar solicitud?',
      '¿Estás seguro de que quieres eliminar esta solicitud? Esta acción no se puede deshacer.',
      async () => {
        try {
          await api.eliminarTrayecto(requestId);
          await loadTrayectos();
          showAlert('Solicitud Eliminada', 'Tu solicitud ha sido eliminada correctamente.', 'success');
        } catch (error) {
          console.error('Error deleting request:', error);
          showAlert('Error', 'No se pudo eliminar la solicitud. Inténtalo de nuevo.', 'error');
        }
      }
    );
  };



  const logout = () => {
    localStorage.removeItem('userProfile');
    setUserProfile(null);
    setAuthStep('login');
    setRegisterForm({
      nombre_completo: '',
      email: '',
      password: '',
      edad: '',
      genero: '',
      localidad: '',
      rol: 'solicitante'
    });
    setHelpRequests([]);
    setMyRequests([]);
    setMyHelps([]);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage(null);
    try {
      await api.forgotPassword(forgotPasswordEmail);
      setForgotPasswordMessage({ type: 'success', text: 'Si el correo existe, recibirás un enlace de recuperación.' });
    } catch (error: any) {
      setForgotPasswordMessage({ type: 'error', text: error.message || 'Error al solicitar recuperación.' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage(null);
    if (!resetToken) return;

    try {
      await api.resetPassword(resetToken, newPassword);
      setForgotPasswordMessage({ type: 'success', text: 'Contraseña restablecida. Redirigiendo al login...' });
      setTimeout(() => {
        setAuthStep('login');
        setForgotPasswordMessage(null);
        setResetToken(null);
      }, 3000);
    } catch (error: any) {
      setForgotPasswordMessage({ type: 'error', text: error.message || 'Error al restablecer contraseña.' });
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = helpCategories.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.label}` : categoryId;
  };

  // --- Funciones de Chat ---
  const openChat = async (trayectoId: number) => {
    setActiveChatId(trayectoId);
    setShowChat(true);
    // Limpiar mensajes anteriores mientras carga
    setChatMessages([]);
    try {
      const msgs = await api.obtenerMensajesPorTrayecto(trayectoId);
      setChatMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !userProfile?.id || !newMessage.trim()) return;

    try {
      const msgData = {
        trayecto_id: activeChatId,
        emisor_id: userProfile.id,
        contenido: newMessage.trim()
      };
      await api.crearMensaje(msgData);
      setNewMessage('');
      // Recargar mensajes
      const msgs = await api.obtenerMensajesPorTrayecto(activeChatId);
      setChatMessages(msgs);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Componente de Ventana de Chat
  const ChatWindow = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!showChat || !activeChatId) return;

      const currentRequest = helpRequests.find(r => r.id === activeChatId);
      const isReadonly = currentRequest?.status !== 'accepted';

      const fetchMsgs = async () => {
        try {
          const msgs = await api.obtenerMensajesPorTrayecto(activeChatId);
          // Evitar re-render innecesario si los mensajes no han cambiado
          setChatMessages((prev) => {
            if (!Array.isArray(prev) || prev.length !== msgs.length) {
              return msgs;
            }

            const isSame = prev.every((m: any, idx: number) =>
              m.id === msgs[idx].id && m.contenido === msgs[idx].contenido
            );

            return isSame ? prev : msgs;
          });
        } catch (error) {
          console.error('Error polling messages:', error);
        }
      };

      if (!isReadonly) {
        const interval = setInterval(fetchMsgs, 4000); // Poll cada 4 segundos para reducir saltos
        return () => clearInterval(interval);
      }
    }, [showChat, activeChatId, helpRequests]);

    useEffect(() => {
      // Cuando lleguen mensajes nuevos, baja siempre abajo del todo
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [chatMessages]);

    if (!showChat || !activeChatId) return null;

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col h-[80vh] animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-3xl shadow-lg">
            <h3 className="font-bold flex items-center gap-2 text-lg">
              <MessageSquare className="w-6 h-6" /> Chat de Ayuda
            </h3>
            <button onClick={() => { setShowChat(false); setActiveChatId(null); }} className="hover:bg-white/20 p-2 rounded-full transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 scroll-smooth">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4 opacity-60">
                <MessageSquare className="w-12 h-12" />
                <p className="text-center italic">No hay mensajes aún.</p>
              </div>
            ) : (
              chatMessages.map((m: any) => (
                <div key={m.id} className={`flex flex-col ${m.emisor_id === userProfile?.id ? 'items-end' : 'items-start animate-in slide-in-from-left-2'}`}>
                  <span className="text-[10px] text-gray-500 mb-1 px-1 font-semibold uppercase tracking-wider">
                    {m.emisor_id === userProfile?.id ? 'Tú' : m.emisor?.nombre_usuario || 'Usuario'}
                  </span>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${m.emisor_id === userProfile?.id
                    ? 'bg-yellow-500 text-white rounded-tr-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                    }`}>
                    {m.contenido}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input - Solo si está activo */}
          {helpRequests.find(r => r.id === activeChatId)?.status === 'accepted' ? (
            <form onSubmit={handleSendMessage} className="p-5 border-t flex items-center gap-2 bg-white rounded-b-3xl shadow-inner w-full overflow-hidden">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 min-w-0 px-5 py-3 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-blue-500 bg-gray-50 transition-all font-medium"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center flex-shrink-0 w-12 h-12"
              >
                <Send className="w-6 h-6" />
              </button>
            </form>
          ) : (
            <div className="p-5 border-t bg-gray-100 text-gray-500 text-center rounded-b-3xl italic text-sm">
              El chat está en modo solo lectura porque la solicitud ha finalizado o expirado.
            </div>
          )}
        </div>
      </div>
    );
  };

  // ===== PANTALLAS =====

  // Pantalla ¿Cómo funciona?
  if (authStep === 'howItWorks') {
    return (
      <>
        <CustomModal />
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => {
                if (userProfile) {
                  setAuthStep('dashboard');
                } else {
                  setAuthStep('register');
                }
              }}
              className="mb-8 flex items-center gap-2 text-gray-600 hover:text-yellow-600 font-bold transition-all bg-white px-4 py-2 rounded-full shadow-sm hover:shadow-md"
            >
              ← Volver
            </button>

            <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
              <div className="inline-block p-4 bg-yellow-400 rounded-3xl shadow-lg mb-6 rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                <img src={logoPuntoVuela} width="120px" alt="Punto Vuela" />
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-orange-500 pb-2">
                Voluntarios Digitales
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Uniendo generaciones a través de la tecnología. Conectamos a personas mayores que necesitan ayuda digital con jóvenes dispuestos a enseñar.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border-b-8 border-yellow-400 transform transition-all hover:-translate-y-2">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">🤝</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Conexión Humana</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Más que una ayuda técnica, creamos vínculos entre vecinos de la misma localidad.</p>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border-b-8 border-orange-400 transform transition-all hover:-translate-y-2">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">📱</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Soporte Digital</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Desde configurar WhatsApp hasta realizar cualquier trámite digital.</p>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-xl border-b-8 border-yellow-500 transform transition-all hover:-translate-y-2">
                <div className="w-16 h-16 bg-yellow-200 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">🏆</div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Premios y Reconocimiento</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Los voluntarios más activos reciben premios y el agradecimiento de su comunidad.</p>
              </div>
            </div>

            <div className="bg-yellow-400 rounded-[3rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-white mb-6">¿Preparado para marcar la diferencia?</h2>
                <button
                  onClick={() => setAuthStep('register')}
                  className="bg-white text-yellow-600 px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:bg-yellow-50 transition-all transform hover:scale-105 active:scale-95"
                >
                  ¡Comenzar ahora!
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Pantalla de registro
  if (authStep === 'register') {
    return (
      <>
        <CustomModal />
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4">
          <div className="max-w-md mx-auto pt-12 animate-in fade-in slide-in-from-top duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-b-8 border-yellow-400">
              <div className="text-center mb-8">
                <div
                  onClick={() => setAuthStep('howItWorks')}
                  className="inline-block p-3 bg-yellow-400 rounded-2xl shadow-lg mb-6 rotate-3 hover:rotate-0 transition-transform cursor-pointer"
                >
                  <img src={logoPuntoVuela} width="80px" alt="Punto Vuela" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-orange-500 pb-2">
                  Voluntarios Digitales
                </h1>
                <p className="text-gray-600">Crea tu cuenta para comenzar</p>
                <button
                  onClick={() => setAuthStep('howItWorks')}
                  className="mt-3 text-yellow-600 font-bold hover:text-yellow-700 transition-all flex items-center gap-1 mx-auto group"
                >
                  ¿Cómo funciona?
                  <Heart className="w-4 h-4 group-hover:scale-125 transition-transform text-yellow-500 fill-yellow-500" />
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
                  <input
                    type="text"
                    value={registerForm.nombre_completo}
                    onChange={(e) => setRegisterForm({ ...registerForm, nombre_completo: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all"
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
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all"
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
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all"
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
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all"
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
                      className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all"
                      required
                    >
                      <option value="">Seleccionar</option>
                      <option value="Hombre">Hombre</option>
                      <option value="Mujer">Mujer</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Localidad</label>
                  <select
                    value={registerForm.localidad}
                    onChange={(e) => setRegisterForm({ ...registerForm, localidad: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all"
                    required
                  >
                    <option value="">Seleccionar</option>
                    <option value="Cuevas del Becerro">Cuevas del Becerro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">¿Cómo quieres usar la plataforma?</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRegisterForm({ ...registerForm, rol: 'solicitante' })}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${registerForm.rol === 'solicitante'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-200'
                        }`}
                    >
                      <User className={`w-8 h-8 ${registerForm.rol === 'solicitante' ? 'text-yellow-600' : 'text-gray-400'}`} />
                      <span className={`font-bold ${registerForm.rol === 'solicitante' ? 'text-yellow-700' : 'text-gray-600'}`}>¡Ayúdame!</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterForm({ ...registerForm, rol: 'voluntario' })}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${registerForm.rol === 'voluntario'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-200'
                        }`}
                    >
                      <Users className={`w-8 h-8 ${registerForm.rol === 'voluntario' ? 'text-yellow-600' : 'text-gray-400'}`} />
                      <span className={`font-bold ${registerForm.rol === 'voluntario' ? 'text-yellow-700' : 'text-gray-600'}`}>Voluntario</span>
                    </button>
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
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-yellow-200"
                >
                  Crear Cuenta
                </button>

                <div className="text-center mt-4">
                  <p className="text-gray-600">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthStep('login')}
                      className="text-yellow-600 font-bold hover:underline"
                    >
                      Inicia Sesión
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Pantalla de Login
  if (authStep === 'login') {
    return (
      <>
        <CustomModal />
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4">
          <div className="max-w-md mx-auto pt-12 animate-in fade-in slide-in-from-top duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-b-8 border-yellow-400">
              <div className="text-center mb-8">
                <div
                  onClick={() => setAuthStep('howItWorks')}
                  className="inline-block p-3 bg-yellow-400 rounded-2xl shadow-lg mb-6 -rotate-3 hover:rotate-0 transition-transform cursor-pointer"
                >
                  <img src={logoPuntoVuela} width="80px" alt="Punto Vuela" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-orange-500 pb-2">
                  Bienvenido de nuevo
                </h1>
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
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all font-medium"
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
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all font-medium"
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
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-yellow-200"
                >
                  Iniciar Sesión
                </button>

                <div className="text-center mt-4">
                  <p className="text-gray-600">
                    ¿No tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthStep('register')}
                      className="text-yellow-600 font-bold hover:underline"
                    >
                      Regístrate
                    </button>
                  </p>
                  <p className="text-gray-600 mt-2">
                    ¿Olvidaste tu contraseña?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthStep('forgotPassword')}
                      className="text-yellow-600 hover:text-yellow-700 font-bold transition-all"
                    >
                      Recuperar contraseña
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Pantalla de correo enviado
  if (authStep === 'verificationSent') {
    return (
      <>
        <CustomModal />
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4 flex items-center justify-center">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full text-center border-b-8 border-yellow-400 animate-in zoom-in duration-500">
            <div
              onClick={() => setAuthStep('howItWorks')}
              className="inline-block p-3 bg-yellow-400 rounded-2xl shadow-lg mb-6 rotate-3 hover:rotate-0 transition-transform cursor-pointer"
            >
              <img src={logoPuntoVuela} width="80px" alt="Punto Vuela" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">¡Verifica tu correo!</h2>
            <p className="text-gray-600 mb-8">
              Hemos enviado un enlace de confirmación a <strong>{registerForm.email}</strong>.
              <br /><br />
              Por favor, revisa tu bandeja de entrada (y el spam) para activar tu cuenta.
            </p>
            <button
              onClick={() => setAuthStep('login')}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg"
            >
              Volver al Iniciar Sesión
            </button>
          </div>
        </div>
      </>
    );
  }

  // Pantalla de recuperación de contraseña (solicitud)
  if (authStep === 'forgotPassword') {
    return (
      <>
        <CustomModal />
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4">
          <div className="max-w-md mx-auto pt-12 animate-in fade-in slide-in-from-top duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-b-8 border-yellow-400">
              <div className="text-center mb-8">
                <div
                  onClick={() => setAuthStep('howItWorks')}
                  className="inline-block p-3 bg-yellow-400 rounded-2xl shadow-lg mb-6 rotate-3 hover:rotate-0 transition-transform cursor-pointer"
                >
                  <img src={logoPuntoVuela} width="80px" alt="Punto Vuela" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Recuperar Contraseña</h2>
                <p className="text-gray-600">Ingresa tu correo para recibir un enlace de recuperación.</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                </div>

                {forgotPasswordMessage && (
                  <div className={`mb-4 p-3 rounded-lg text-sm text-center font-bold ${forgotPasswordMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {forgotPasswordMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg"
                >
                  Enviar Enlace
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={() => setAuthStep('login')}
                  className="text-yellow-600 hover:text-yellow-700 font-bold"
                >
                  Volver a Iniciar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Pantalla de restablecer contraseña (nueva password)
  if (authStep === 'resetPassword') {
    return (
      <>
        <CustomModal />
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4">
          <div className="max-w-md mx-auto pt-12 animate-in fade-in slide-in-from-top duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-b-8 border-yellow-400">
              <div className="text-center mb-8">
                <div
                  onClick={() => setAuthStep('howItWorks')}
                  className="inline-block p-3 bg-yellow-400 rounded-2xl shadow-lg mb-6 -rotate-3 hover:rotate-0 transition-transform cursor-pointer"
                >
                  <img src={logoPuntoVuela} width="80px" alt="Punto Vuela" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Nueva Contraseña</h2>
                <p className="text-gray-600">Ingresa tu nueva contraseña para acceder.</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                {forgotPasswordMessage && (
                  <div className={`mb-4 p-3 rounded-lg text-sm text-center font-bold ${forgotPasswordMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {forgotPasswordMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg"
                >
                  Restablecer Contraseña
                </button>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }



  const getMedalEmoji = (pos: number) => {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return pos;
  };

  const getTopThreeClass = (pos: number) => {
    if (pos === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white scale-105';
    if (pos === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900';
    if (pos === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
    return 'bg-white border border-gray-200';
  };

  // Pantalla de Ranking
  if (showRanking && userProfile) {
    return (
      <>
        <CustomModal />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setShowRanking(false)}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
              >
                ← Volver
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">🏆 Ranking de Voluntarios</h1>
                <p className="text-gray-600">Top 15 voluntarios más activos</p>
                <p className="text-sm text-purple-600 font-semibold mt-2">¡Los 3 primeros reciben premio!</p>
              </div>

              {(!Array.isArray(ranking) || ranking.length === 0) ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {Array.isArray(ranking) ? 'No hay voluntarios en el ranking todavía.' : 'Error al cargar el ranking.'}
                  </p>
                  <button
                    onClick={async () => {
                      const data = await api.getRanking();
                      setRanking(data);
                    }}
                    className="mt-4 text-blue-600 font-semibold hover:underline"
                  >
                    Intentar recargar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {ranking.map((entry) => (
                    <div
                      key={entry.id}
                      className={`${getTopThreeClass(entry.posicion)} rounded-xl p-5 transition-all transform hover:scale-102 ${entry.posicion <= 3 ? 'shadow-xl border-2 border-yellow-500' : 'shadow-md'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`${entry.posicion <= 3
                            ? 'text-5xl font-bold'
                            : 'text-2xl font-semibold w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-700'
                            }`}>
                            {getMedalEmoji(entry.posicion)}
                          </div>
                          <div className="flex-1">
                            <h3 className={`${entry.posicion <= 3 ? 'text-2xl' : 'text-xl'} font-bold ${entry.posicion <= 3 && entry.posicion !== 2 ? 'text-white' : 'text-gray-800'
                              }`}>
                              {entry.nombre}
                            </h3>
                            <p className={`text-sm ${entry.posicion <= 3 && entry.posicion !== 2 ? 'text-white/80' : 'text-gray-600'
                              }`}>
                              {entry.localidad}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`${entry.posicion <= 3 ? 'text-4xl' : 'text-3xl'} font-bold ${entry.posicion <= 3 && entry.posicion !== 2 ? 'text-white' : 'text-purple-600'
                            }`}>
                            {entry.ayudas_completadas}
                          </div>
                          <div className={`text-xs ${entry.posicion <= 3 && entry.posicion !== 2 ? 'text-white/80' : 'text-gray-500'
                            }`}>
                            ayudas
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Dashboard para Usuario (necesita ayuda)
  if (userProfile && userProfile.type === 'user') {
    return (
      <>
        <CustomModal />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header con botón de logout */}
            <div className="flex justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setAuthStep('howItWorks')}
                  className="p-1.5 bg-yellow-400 rounded-lg shadow-md rotate-3 flex-shrink-0 cursor-pointer hover:rotate-0 transition-transform"
                >
                  <img src={logoPuntoVuela} width="32px" alt="Punto Vuela" />
                </div>
                <span className="font-black text-gray-800 text-sm md:text-base hidden sm:block">Digitales</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setShowRanking(true);
                    const data = await api.getRanking();
                    setRanking(data);
                  }}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  🏆 Ranking
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md transform hover:scale-105"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </div>
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
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-md group"
              >
                <AlertCircle className="w-5 h-5" />
                Solicitar Ayuda
              </button>
            </div>

            {showRequestForm && (
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 mb-8 border-t-8 border-yellow-500 transition-all animate-in zoom-in duration-300">
                <h3 className="font-black text-gray-900 mb-6 text-2xl flex items-center gap-2">
                  <span className="p-2 bg-yellow-400 rounded-lg shadow-sm rotate-3">
                    <AlertCircle className="w-6 h-6 text-gray-900" />
                  </span>
                  Nueva Solicitud de Ayuda
                </h3>

                <div className="mb-6">
                  <label className="block text-gray-700 font-bold mb-3 ml-1">¿En qué necesitas ayuda?</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {helpCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setRequestData({ ...requestData, category: cat.id })}
                        className={`p-4 rounded-xl font-bold transition-all transform hover:scale-105 ${requestData.category === cat.id
                          ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-200 ring-2 ring-yellow-400'
                          : 'bg-gray-50 text-gray-700 border-2 border-gray-100 hover:border-yellow-200'
                          }`}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 font-bold mb-3 ml-1">Describe tu solicitud</label>
                  <textarea
                    value={requestData.description}
                    onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 text-gray-800 rounded-xl border-2 border-gray-100 focus:border-yellow-500 focus:outline-none transition-all font-medium"
                    rows={3}
                    placeholder="Explica brevemente lo que necesitas..."
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-gray-700 font-bold mb-3 ml-1">Ubicación</label>
                  <div className="grid grid-cols-1 gap-2">
                    {predefinedLocations.map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedLocationId(loc.id)}
                        className={`p-4 rounded-xl font-bold transition-all transform hover:scale-102 flex items-center gap-3 ${selectedLocationId === loc.id
                          ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-200 ring-2 ring-yellow-400'
                          : 'bg-gray-50 text-gray-700 border-2 border-gray-100 hover:border-yellow-200'
                          }`}
                      >
                        {loc.icon} {loc.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={createHelpRequest}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-xl shadow-green-100 flex items-center justify-center gap-2"
                >
                  Confirmar y Enviar Solicitud
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
                    <div key={req.id} className="bg-white border-2 border-gray-100 rounded-[2rem] p-6 shadow-md hover:border-yellow-200 transition-all group relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-600 text-white">
                              {getCategoryLabel(req.category)}
                            </span>
                            {req.status === 'pending' && <CountdownTimer timestamp={req.createdAt} />}
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${req.status === 'pending' ? 'bg-yellow-600 text-white' :
                              req.status === 'accepted' ? 'bg-green-600 text-white' :
                                req.status === 'expired' ? 'bg-red-600 text-white' :
                                  'bg-gray-600 text-white'
                              }`}>
                              {req.status === 'pending' ? 'Pendiente' : req.status === 'accepted' ? 'Aceptada' : req.status === 'expired' ? 'Expirada' : 'Completada'}
                            </span>
                          </div>
                          <p className="text-gray-800 font-medium mb-3">{req.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {req.timestamp}
                            </span>
                            {req.location && (
                              <span className="font-medium">{req.location.name}</span>
                            )}
                          </div>
                          {(req.volunteer || req.status === 'expired') && (
                            <div className="mt-4 flex flex-col gap-3">
                              <span className={`text-sm font-bold ${req.status === 'expired' ? 'text-red-500' : 'text-green-600'}`}>
                                {req.status === 'expired' ? '⚠️ Nadie acudió a tiempo' : `✓ Voluntario: ${req.volunteer}`}
                              </span>
                              <button
                                onClick={() => openChat(req.id)}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold transition-all shadow-md transform hover:scale-105 flex items-center justify-center gap-2"
                              >
                                💬 Abrir Chat
                              </button>
                              {req.status === 'expired' && (
                                <button
                                  onClick={() => deleteHelpRequest(req.id)}
                                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-all shadow-md transform hover:scale-105 flex items-center justify-center gap-2"
                                  title="Eliminar solicitud"
                                >
                                  <span className="text-lg leading-none">🗑️</span>
                                  Eliminar solicitud
                                </button>
                              )}
                              {req.status === 'accepted' && !req.confirmacion_solicitante && (
                                <button
                                  onClick={() => confirmArrival(req.id)}
                                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-all shadow-md transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                  ✅ ¡Han llegado para ayudarme!
                                </button>
                              )}
                              {req.status === 'accepted' && req.confirmacion_solicitante && (
                                <p className="text-xs text-center text-green-600 font-bold bg-green-50 py-2 rounded-lg border border-green-100 italic">
                                  ¡Ya has confirmado! Esperando confirmación final del voluntario...
                                </p>
                              )}
                            </div>
                          )}
                          {req.status === 'pending' && (
                            <div className="mt-4">
                              <button
                                onClick={() => deleteHelpRequest(req.id)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                                title="Eliminar solicitud"
                              >
                                <span className="text-lg leading-none">🗑️</span>
                                Eliminar solicitud
                              </button>
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
          <ChatWindow />
        </div>
      </>
    );
  }

  // Dashboard para Voluntario
  if (userProfile && userProfile.type === 'volunteer') {
    const pendingRequests = helpRequests.filter(req => req.status === 'pending');
    const hasActiveHelp = myHelps.filter(h => h.status === 'accepted').length > 0;

    return (
      <>
        <CustomModal />
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Header con logout */}
            <div className="flex justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setAuthStep('howItWorks')}
                  className="p-1.5 bg-yellow-400 rounded-lg shadow-md -rotate-3 flex-shrink-0 cursor-pointer hover:rotate-0 transition-transform"
                >
                  <img src={logoPuntoVuela} width="32px" alt="Punto Vuela" />
                </div>
                <span className="font-black text-gray-800 text-sm md:text-base hidden sm:block">Digitales</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setShowRanking(true);
                    const data = await api.getRanking();
                    setRanking(data);
                  }}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  🏆 Ranking
                </button>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-md transform hover:scale-105"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </div>
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
                      <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-0">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-black">
                              {getCategoryLabel(req.category)}
                            </span>
                            <span className="text-sm text-gray-600">
                              {req.userGender}, {req.userAge} años
                            </span>
                            <CountdownTimer timestamp={req.createdAt} />
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
                          className={`w-full md:w-auto md:ml-4 px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-lg font-semibold transition-all ${hasActiveHelp
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
                      <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-0">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                        <div className="flex flex-col gap-2 w-full md:w-auto md:ml-4">
                          <div className="flex flex-row md:flex-col gap-2">
                            <button
                              onClick={() => openChat(help.id)}
                              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-lg font-semibold transition-all shadow-md transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                              💬 Chat
                            </button>
                            {help.status === 'accepted' && (
                              <button
                                onClick={() => completeHelp(help.id)}
                                disabled={help.confirmacion_voluntario}
                                className={`flex-1 px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-lg font-semibold transition-all shadow-md transform hover:scale-105 flex items-center justify-center gap-2 ${help.confirmacion_voluntario
                                  ? 'bg-gray-400 cursor-not-allowed text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                                  }`}
                              >
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <span className="whitespace-nowrap">
                                  {help.confirmacion_voluntario ? 'Esperando al otro...' : 'Completar'}
                                </span>
                              </button>
                            )}
                          </div>
                          {help.status === 'accepted' && help.confirmacion_voluntario && !help.confirmacion_solicitante && (
                            <p className="text-[10px] md:text-xs text-center text-yellow-700 font-bold bg-yellow-50 py-2 px-1 rounded-lg border border-yellow-200 animate-pulse">
                              ⏳ Tú ya has confirmado. ¡Falta que el solicitante pulse en "Han llegado"!
                            </p>
                          )}
                          {help.status === 'accepted' && help.confirmacion_solicitante && !help.confirmacion_voluntario && (
                            <p className="text-[10px] md:text-xs text-center text-green-700 font-bold bg-green-50 py-2 px-1 rounded-lg border border-green-200">
                              📢 ¡El solicitante dice que ya has llegado! Pulsa el botón verde para completar.
                            </p>
                          )}
                          {help.status === 'accepted' && (
                            <button
                              onClick={() => cancelHelp(help.id)}
                              className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                            >
                              <AlertCircle className="w-4 h-4" />
                              Cancelar Ayuda
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ChatWindow />
        </div>
      </>
    );
  }

  return null;
};

export default App;