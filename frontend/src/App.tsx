import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Users, User, Heart, Clock, CheckCircle, Mail, Lock, LogOut, MessageSquare, Send, Eye, EyeOff } from 'lucide-react';
import './index.css';
import * as api from './services/api';
import logoPuntoVuela from './assets/Logo Punto Vuela.jpg';
import Footer from './components/Footer';

// --- Interfaces ---
interface UserProfile {
  id: number;
  name: string;
  email: string;
  gender: string;
  age: string;
  localidad: string;
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

interface ChatWindowProps {
  showChat: boolean;
  activeChatId: number | null;
  userProfile: UserProfile | null;
  helpRequests: HelpRequest[];
  chatMessages: any[];
  setChatMessages: (messages: any[] | ((prev: any[]) => any[])) => void;
  setShowChat: (show: boolean) => void;
  setActiveChatId: (id: number | null) => void;
  handleSendMessage: (e: React.FormEvent) => Promise<void>;
  newMessage: string;
  setNewMessage: (message: string) => void;
  isSendingMessage: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  showChat,
  activeChatId,
  userProfile,
  helpRequests,
  chatMessages,
  setChatMessages,
  setShowChat,
  setActiveChatId,
  handleSendMessage,
  newMessage,
  setNewMessage,
  isSendingMessage
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showChat || !activeChatId) return;

    const currentRequest = helpRequests.find(r => r.id === activeChatId);
    const isReadonly = currentRequest?.status !== 'accepted';

    const fetchMsgs = async () => {
      try {
        if (!activeChatId || !userProfile?.id) return;
        const msgs = await api.obtenerMensajesPorTrayecto(activeChatId, userProfile.id);
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
      const interval = setInterval(fetchMsgs, 2000);
      return () => clearInterval(interval);
    }
  }, [showChat, activeChatId, helpRequests, setChatMessages, userProfile?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  if (!showChat || !activeChatId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col h-[80vh] animate-in fade-in zoom-in duration-300">
        <div className="p-5 border-b flex justify-between items-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-3xl shadow-lg">
          <h3 className="font-bold flex items-center gap-2 text-lg">
            <MessageSquare className="w-6 h-6" /> Chat de Ayuda
          </h3>
          <button onClick={() => { setShowChat(false); setActiveChatId(null); }} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
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
              disabled={!newMessage.trim() || isSendingMessage}
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
  const [authStep, setAuthStep] = useState<'register' | 'login' | 'dashboard' | 'verificationSent' | 'forgotPassword' | 'resetPassword' | 'howItWorks' | 'awaitingAdminApproval' | 'adminLogin' | 'adminPanel'>('register');
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
  const [showPassword, setShowPassword] = useState(false);

  // Estados para recuperación de contraseña
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Estados para errores en línea (feedback inmediato)
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
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
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Estados para Panel Admin
  const [adminCredentials, setAdminCredentials] = useState({
    username: '',
    password: ''
  });
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<Set<number>>(new Set());
  const [lastReadMessageMap, setLastReadMessageMap] = useState<Record<number, number>>({});

  // Cargar estado de leídos al inicio
  // Cargar estado de leídos al inicio (depende del usuario)
  useEffect(() => {
    if (!userProfile?.id) return;
    const key = `lastReadMessageMap_${userProfile.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setLastReadMessageMap(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing stored read state', e);
      }
    } else {
      setLastReadMessageMap({});
    }
  }, [userProfile?.id]);

  // Guardar estado de leídos
  // Guardar estado de leídos
  useEffect(() => {
    if (!userProfile?.id) return;
    const key = `lastReadMessageMap_${userProfile.id}`;
    localStorage.setItem(key, JSON.stringify(lastReadMessageMap));
  }, [lastReadMessageMap, userProfile?.id]);

  // DEBUG: Monitor notifications
  useEffect(() => {
    console.log('DEBUG: unreadNotifications changed:', Array.from(unreadNotifications));
  }, [unreadNotifications]);

  // Polling para notificaciones
  useEffect(() => {
    console.log('DEBUG: Notification Effect TRACE. Profile:', userProfile ? userProfile.id : 'null', 'Chats:', helpRequests.length);

    if (!userProfile?.id) {
      console.log('DEBUG: Early return due to missing profile');
      return;
    }

    const checkNotifications = async () => {
      // Filtrar chats relevantes (donde participo y están aceptados)
      const requestsToCheck = helpRequests.filter(r =>
        (Number(r.solicitante_id) === Number(userProfile.id) || Number(r.voluntario_id) === Number(userProfile.id)) &&
        r.status === 'accepted'
      );

      // DEBUG: Ver qué requests está revisando
      console.log(`DEBUG: User ${userProfile.id} checking ${requestsToCheck.length} accepted chats.`);

      for (const req of requestsToCheck) {
        if (req.id === activeChatId && showChat) continue;

        try {
          const msgs = await api.obtenerMensajesPorTrayecto(req.id, userProfile.id);
          if (msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];

            // Debug de lógica de notificación
            const isMine = Number(lastMsg.emisor_id) === Number(userProfile.id);
            const lastReadId = lastReadMessageMap[req.id] || 0;
            const isNew = lastMsg.id > lastReadId;

            console.log(`DEBUG Chat ${req.id}: LastMsgID=${lastMsg.id} (Sender=${lastMsg.emisor_id}) vs Me=${userProfile.id}. isMine=${isMine}, LastRead=${lastReadId}, isNew=${isNew}`);

            // Si el último mensaje no es mío
            if (!isMine) {
              if (isNew) {
                console.log(`DEBUG: *** NOTIFICACION ACTIVADA para Chat ${req.id} ***`);
                setUnreadNotifications(prev => {
                  if (prev.has(req.id)) return prev;
                  const newSet = new Set(prev);
                  newSet.add(req.id);
                  return newSet;
                });
              }
            }
          }
        } catch (e) {
          console.error('Error checking notifications:', e);
        }
      }
    };

    checkNotifications();

    const interval = setInterval(checkNotifications, 3000); // Check cada 3s (casi instantáneo)
    return () => clearInterval(interval);
  }, [userProfile, helpRequests, activeChatId, showChat, lastReadMessageMap]);


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

  const locationsByTown: Record<string, Location[]> = {
    'Cuevas del Becerro': [
      { id: 'loc1', name: 'Punto Vuela', lat: 37.2965, lng: -1.8687, icon: '💻', color: 'blue' },
      { id: 'loc2', name: 'Puerta Colegio', lat: 37.2970, lng: -1.8690, icon: '🏫', color: 'purple' },
      { id: 'loc3', name: 'El Nacimiento', lat: 37.2980, lng: -1.8680, icon: '🏞️', color: 'green' },
      { id: 'loc4', name: 'Rafael Alberti', lat: 37.2990, lng: -1.8675, icon: '📚', color: 'red' }
    ],
    'Alameda': [
      { id: 'alameda1', name: 'Plaza España', lat: 37.2470, lng: -1.7920, icon: '🏛️', color: 'blue' },
      { id: 'alameda2', name: 'Plaza Andalucía', lat: 37.2480, lng: -1.7910, icon: '🏘️', color: 'purple' },
      { id: 'alameda3', name: 'Campo de Futbol Polideportivo', lat: 37.2490, lng: -1.7900, icon: '⚽', color: 'green' }
    ],
    'Serrato': [
      { id: 'serrato1', name: 'Iglesia de Serrato', lat: 37.3200, lng: -1.8500, icon: '⛪', color: 'blue' },
      { id: 'serrato2', name: 'Ayuntamiento de Serrato', lat: 37.3208, lng: -1.8492, icon: '🏛️', color: 'purple' },
      { id: 'serrato3', name: 'Plaza del Pueblo', lat: 37.3195, lng: -1.8508, icon: '🌳', color: 'green' }
    ],
    'Cañete la Real': [
      { id: 'canete1', name: 'Ayuntamiento de Cañete la Real', lat: 37.3400, lng: -1.8200, icon: '🏛️', color: 'blue' },
      { id: 'canete2', name: 'Iglesia de la Encarnación', lat: 37.3408, lng: -1.8192, icon: '⛪', color: 'purple' },
      { id: 'canete3', name: 'Polideportivo Municipal', lat: 37.3390, lng: -1.8210, icon: '⚽', color: 'green' }
    ],
    'La Atalaya': [
      { id: 'atalaya1', name: 'Iglesia de La Atalaya', lat: 37.2800, lng: -1.9000, icon: '⛪', color: 'blue' },
      { id: 'atalaya2', name: 'Ayuntamiento La Atalaya', lat: 37.2808, lng: -1.8992, icon: '🏛️', color: 'purple' },
      { id: 'atalaya3', name: 'Plaza Central', lat: 37.2793, lng: -1.9007, icon: '🌳', color: 'green' }
    ],
    'Arriate': [
      { id: 'arriate1', name: 'Ayuntamiento de Arriate', lat: 37.3000, lng: -1.7800, icon: '🏛️', color: 'blue' },
      { id: 'arriate2', name: 'Iglesia de Arriate', lat: 37.3008, lng: -1.7792, icon: '⛪', color: 'purple' },
      { id: 'arriate3', name: 'Polideportivo de Arriate', lat: 37.2990, lng: -1.7810, icon: '⚽', color: 'green' }
    ],
    'Los Prados': [
      { id: 'prados1', name: 'Iglesia de Los Prados', lat: 37.2900, lng: -1.7700, icon: '⛪', color: 'blue' },
      { id: 'prados2', name: 'Plaza del Pueblo', lat: 37.2908, lng: -1.7692, icon: '🌳', color: 'purple' }
    ],
    'Villanueva de la Concepción': [
      { id: 'villanueva1', name: 'Ayuntamiento de Villanueva', lat: 37.3100, lng: -1.7600, icon: '🏛️', color: 'blue' },
      { id: 'villanueva2', name: 'Iglesia de la Concepción', lat: 37.3108, lng: -1.7592, icon: '⛪', color: 'purple' },
      { id: 'villanueva3', name: 'Plaza Mayor', lat: 37.3093, lng: -1.7608, icon: '🌳', color: 'green' }
    ],
    'Pizarra': [
      { id: 'pizarra1', name: 'Plaza de la Cultura', lat: 37.2600, lng: -1.7400, icon: '🎭', color: 'blue' },
      { id: 'pizarra2', name: 'Plaza del Ayuntamiento', lat: 37.2610, lng: -1.7390, icon: '🏛️', color: 'purple' },
      { id: 'pizarra3', name: 'Biblioteca', lat: 37.2590, lng: -1.7410, icon: '📚', color: 'green' }
    ],
    'Campillos': [
      { id: 'campillos1', name: 'Puerta del Ayuntamiento', lat: 37.3300, lng: -1.6800, icon: '🏛️', color: 'blue' },
      { id: 'campillos2', name: 'Puerta de Iglesia', lat: 37.3310, lng: -1.6790, icon: '⛪', color: 'purple' },
      { id: 'campillos3', name: 'Puerta Polideportivo', lat: 37.3290, lng: -1.6810, icon: '⚽', color: 'green' }
    ],
    'Mollina': [
      { id: 'mollina1', name: 'Puerta Iglesia', lat: 37.3500, lng: -1.7100, icon: '⛪', color: 'blue' },
      { id: 'mollina2', name: 'Pista de Padel en la Caleta', lat: 37.3510, lng: -1.7090, icon: '🎾', color: 'purple' },
      { id: 'mollina3', name: 'Biblioteca', lat: 37.3490, lng: -1.7110, icon: '📚', color: 'green' }
    ],
    'Montecorto': [
      { id: 'montecorto1', name: 'Plaza Ermita', lat: 37.2700, lng: -1.8900, icon: '⛪', color: 'blue' },
      { id: 'montecorto2', name: 'Calle Pablo Ruíz Picasso', lat: 37.2710, lng: -1.8890, icon: '🎨', color: 'purple' },
      { id: 'montecorto3', name: 'Ayuntamiento Montecorto', lat: 37.2690, lng: -1.8910, icon: '🏛️', color: 'green' }
    ]
  };

  const getPredefinedLocations = (): Location[] => {
    const localidad = userProfile?.localidad || registerForm.localidad;
    return locationsByTown[localidad] || locationsByTown['Cuevas del Becerro'] || [];
  };

  const helpCategories = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
    { id: 'redes', label: 'Redes Sociales', icon: '📱' },
    { id: 'correo', label: 'Correo Electrónico', icon: '📧' },
    { id: 'videollamada', label: 'Videollamada', icon: '📹' },
    { id: 'cita-previa', label: 'Cita Previa', icon: '📅' },
    { id: 'documentos', label: 'Documentos', icon: '📄' }
  ];

  // Cargar usuario de localStorage y verificar token de URL.
  useEffect(() => {
    // 1. Check URL for reset token
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const verified = urlParams.get('verified');
    const view = urlParams.get('view');

    if (token) {
      setResetToken(token);
      setAuthStep('resetPassword');
      // Limpiar URL para que no se vea feo
      window.history.replaceState({}, '', window.location.pathname);
    } else if (verified === 'true') {
      setAuthStep('login');
      setLoginError(null); // Limpiar errores
      showAlert('¡Cuenta Verificada!', 'Tu correo ha sido verificado correctamente. Ya puedes iniciar sesión.', 'success');
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    } else {
      // 2. Check localStorage if no token
      const saved = localStorage.getItem('userProfile');
      if (saved) {
        const profile = JSON.parse(saved);
        setUserProfile(profile);
        setAuthStep('dashboard');
      } else if (view === 'login') {
        setAuthStep('login');
        // Limpiar URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Cargar solicitudes cuando hay usuario.
  useEffect(() => {
    if (userProfile) {
      loadTrayectos();
    }
  }, [userProfile]);

  // Polling automático para voluntarios (actualizar solicitudes cada 2 segundos)
  useEffect(() => {
    if (userProfile?.type !== 'volunteer' || !userProfile?.id) return;

    // Hacer polling inmediatamente y luego cada 2 segundos
    const interval = setInterval(() => {
      loadTrayectos();
    }, 2000);

    return () => clearInterval(interval);
  }, [userProfile?.type, userProfile?.id]);

  // Polling automático para solicitantes (actualizar sus solicitudes cada 4 segundos)
  // Esto permite detectar cuando un voluntario acepta la solicitud sin refrescar
  useEffect(() => {
    if (userProfile?.type !== 'user' || !userProfile?.id) return;

    const interval = setInterval(() => {
      loadTrayectos();
    }, 4000);

    return () => clearInterval(interval);
  }, [userProfile?.type, userProfile?.id]);

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
        age: usuario.edad?.toString() || '',
        localidad: usuario.localidad || ''
      };

      setUserProfile(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
      setAuthStep('dashboard');

    } catch (error: any) {
      console.error('Error login:', error);
      if (error.status === 403 && error.awaiting_approval) {
        // Usuario existe pero está esperando aprobación de admin
        setAuthStep('awaitingAdminApproval');
        setLoginForm({ email: loginForm.email, password: '' }); // Limpiar contraseña
      } else if (error.status === 401 || error.status === 404) {
        setLoginError('Contraseña o correo incorrectos');
      } else {
        setLoginError(error.message || 'Error al iniciar sesión');
      }
    }
  };


  // Manejar registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Evitar clics múltiples
    if (isRegistering) return;

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

    // Validar edad >= 18
    const edadInt = parseInt(edad);
    if (edadInt < 18) {
      setRegisterError('Debes tener al menos 18 años para registrarte');
      return;
    }

    setIsRegistering(true);
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
    } finally {
      setIsRegistering(false);
    }
  };



  // Crear solicitud
  const createHelpRequest = async () => {
    if (isCreatingRequest) return;
    if (!userProfile?.id || !selectedLocationId || !requestData.category || !requestData.description) {
      showAlert('Datos incompletos', 'Por favor completa todos los campos para que los voluntarios puedan ayudarte mejor.', 'alert');
      return;
    }

    const selectedLoc = getPredefinedLocations().find(loc => loc.id === selectedLocationId);
    if (!selectedLoc) return;

    setIsCreatingRequest(true);
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
    } finally {
      setIsCreatingRequest(false);
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
    } catch (error: any) {
      console.error('Error accepting help:', error);

      // Verificar si el error es por conflicto (otro voluntario ya la aceptó)
      if (error.status === 409 && error.message && error.message.includes('ya ha sido aceptada')) {
        // Recargar solicitudes para reflejar el cambio
        await loadTrayectos();
        showAlert(
          'Solicitud No Disponible',
          'Lo sentimos, otro voluntario ya ha aceptado esta solicitud mientras intentabas aceptarla. ¡Intenta con otra!',
          'alert'
        );
      } else {
        showAlert('Error', 'No se pudo aceptar la ayuda. Por favor, inténtalo de nuevo.', 'error');
      }
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
      'Si cancelas, la solicitud volverá a estar pendiente para que otros voluntarios puedan aceptarla. Los mensajes del chat serán eliminados.',
      async () => {
        try {
          // Eliminar mensajes del chat
          try {
            await api.eliminarMensajesPorTrayecto(requestId);
          } catch (msgError) {
            console.warn('Warning: Could not delete messages:', msgError);
            // Continuar aunque falle la eliminación de mensajes
          }

          // Cancelar la solicitud
          await api.actualizarTrayecto(requestId, {
            estado: 'PENDIENTE',
            voluntario_id: null,
            fecha_creacion: new Date().toISOString() // Reiniciar el temporizador de 30 mins
          } as any);
          await loadTrayectos();
          showAlert('Ayuda Cancelada', 'La solicitud ha vuelto al estado pendiente y los mensajes han sido eliminados.', 'success');
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

  // --- Funciones de Admin ---
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    try {
      const response = await api.adminLogin({
        username: adminCredentials.username,
        password: adminCredentials.password
      });

      setAdminToken(response.token);
      setAuthStep('adminPanel');
      setAdminCredentials({ username: '', password: '' });

      // Cargar usuarios pendientes
      setTimeout(() => loadPendingUsers(response.token), 500);
    } catch (error: any) {
      console.error('Error admin login:', error);
      setAdminError(error.message || 'Credenciales incorrectas');
    } finally {
      setAdminLoading(false);
    }
  };

  const loadPendingUsers = async (token: string) => {
    setIsLoadingUsers(true);
    try {
      const data = await api.adminGetPendingUsers(token);
      setPendingUsers(data.pending || []);
      setApprovedUsers(data.approved || []);
    } catch (error: any) {
      console.error('Error loading pending users:', error);
      setAdminError(error.message);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleApproveUser = async (userId: number) => {
    if (!adminToken) return;

    try {
      await api.adminApproveUser(userId, adminToken);
      showAlert('✓ Usuario Aprobado', 'El usuario ha sido aprobado exitosamente', 'success');
      // Recargar lista
      await loadPendingUsers(adminToken);
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    }
  };

  const handleDenyUser = async (userId: number) => {
    if (!adminToken) return;

    showConfirm(
      'Denegar Usuario',
      '¿Estás seguro de que deseas denegar el acceso a este usuario?',
      async () => {
        try {
          await api.adminDenyUser(userId, adminToken);
          showAlert('✓ Usuario Denegado', 'El acceso ha sido denegado', 'success');
          await loadPendingUsers(adminToken);
        } catch (error: any) {
          showAlert('Error', error.message, 'error');
        }
      }
    );
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    setAdminCredentials({ username: '', password: '' });
    setAdminError(null);
    setPendingUsers([]);
    setApprovedUsers([]);
    setAuthStep('login');
    showAlert('Sesión Cerrada', 'Has cerrado tu sesión de administrador', 'success');
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = helpCategories.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.label}` : categoryId;
  };

  // --- Funciones de Chat ---
  const openChat = async (trayectoId: number) => {
    setActiveChatId(trayectoId);
    setShowChat(true);
    // Limpiar notificación visual
    setUnreadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(trayectoId);
      return newSet;
    });

    // Limpiar mensajes anteriores mientras carga
    setChatMessages([]);
    try {
      if (!userProfile?.id) return;
      const msgs = await api.obtenerMensajesPorTrayecto(trayectoId, userProfile.id);
      setChatMessages(msgs);

      // Actualizar último leído
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        setLastReadMessageMap(prev => ({
          ...prev,
          [trayectoId]: lastMsg.id
        }));
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      // Mostrar alerta si hay problema de permiso
      if (error.status === 403) {
        showAlert('Acceso Denegado', 'No tienes permiso para ver estos mensajes.', 'error');
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || !userProfile?.id || !newMessage.trim() || isSendingMessage) return;

    setIsSendingMessage(true);
    try {
      const msgData = {
        trayecto_id: activeChatId,
        emisor_id: userProfile.id,
        contenido: newMessage.trim()
      };
      await api.crearMensaje(msgData);
      setNewMessage('');
      // Recargar mensajes
      const msgs = await api.obtenerMensajesPorTrayecto(activeChatId, userProfile.id);
      setChatMessages(msgs);

      // Actualizar mi lectura
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        setLastReadMessageMap(prev => ({
          ...prev,
          [activeChatId]: lastMsg.id
        }));
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      // Mostrar alerta si hay error
      if (error.status === 403) {
        showAlert('No permitido', 'No puedes enviar mensajes en este chat.', 'error');
      } else if (error.status === 400) {
        showAlert('Chat cerrado', 'No puedes enviar mensajes porque esta solicitud ya no está activa.', 'alert');
      }
    } finally {
      setIsSendingMessage(false);
    }
  };

  // ===== PANTALLAS =====

  // Pantalla ¿Cómo funciona?
  if (authStep === 'howItWorks') {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <CustomModal />
          <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4 md:p-8">
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
                  Uniendo generaciones a través de la tecnología. Conectamos a personas que necesitan ayuda digital con jóvenes dispuestos a enseñar.
                </p>

                <div className="mt-8 flex justify-center">
                  <div className="w-full max-w-2xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-yellow-400">
                    <iframe
                      width="100%"
                      height="100%"
                      src="https://www.youtube.com/embed/oY11f7Slee4"
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
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

              {!userProfile && (
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
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Pantalla de registro
  if (authStep === 'register') {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <CustomModal />
          <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4">
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
                  <button
                    type="button"
                    onClick={() => setAuthStep('howItWorks')}
                    className="text-base text-yellow-500 hover:text-yellow-600 transition-all font-semibold mt-2 group"
                  >
                    ¿Cómo funciona? <span className="text-yellow-400 group-hover:text-yellow-500 transition-all">♥️</span>
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
                        type={showPassword ? 'text' : 'password'}
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        className="w-full pl-11 pr-12 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all"
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
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
                      <option value="Serrato">Serrato</option>
                      <option value="Cañete la Real">Cañete la Real</option>
                      <option value="La Atalaya">La Atalaya</option>
                      <option value="Arriate">Arriate</option>
                      <option value="Los Prados">Los Prados</option>
                      <option value="Alameda">Alameda</option>
                      <option value="Villanueva de la Concepción">Villanueva de la Concepción</option>
                      <option value="Pizarra">Pizarra</option>
                      <option value="Campillos">Campillos</option>
                      <option value="Mollina">Mollina</option>
                      <option value="Montecorto">Montecorto</option>
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
                    disabled={isRegistering}
                    className={`w-full py-4 rounded-xl font-bold transition-all transform shadow-lg ${isRegistering
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-white hover:scale-105 shadow-yellow-200'
                      }`}
                  >
                    {isRegistering ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <span>Creando cuenta...</span>
                      </div>
                    ) : (
                      'Crear Cuenta'
                    )}
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
        </main>
        <Footer />
      </div>
    );
  }

  // Pantalla de Login
  if (authStep === 'login') {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <CustomModal />
          <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4">
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
                    Bienvenido de nuevo
                  </h1>
                  <p className="text-gray-600">Inicia sesión para continuar</p>
                  <button
                    type="button"
                    onClick={() => setAuthStep('howItWorks')}
                    className="text-base text-yellow-500 hover:text-yellow-600 transition-all font-semibold mt-2 group"
                  >
                    ¿Cómo funciona? <span className="text-yellow-400 group-hover:text-yellow-500 transition-all">♥️</span>
                  </button>
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
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full pl-11 pr-12 py-3 border-2 border-gray-100 rounded-xl focus:border-yellow-500 focus:outline-none bg-gray-50 transition-all font-medium"
                        placeholder="Tu contraseña"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
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
                    <p className="text-gray-600 mt-3 border-t border-gray-300 pt-3">
                      <button
                        type="button"
                        onClick={() => setAuthStep('adminLogin')}
                        className="text-orange-600 hover:text-orange-700 font-bold transition-all"
                      >
                        🔐 Panel de Admin
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Pantalla de correo enviado
  if (authStep === 'verificationSent') {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <CustomModal />
          <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4 flex items-center justify-center">
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
        </main>
        <Footer />
      </div>
    );
  }

  // Pantalla de recuperación de contraseña (solicitud)
  if (authStep === 'forgotPassword') {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <CustomModal />
          <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4">
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
                  <button
                    type="button"
                    onClick={() => setAuthStep('howItWorks')}
                    className="text-base text-yellow-500 hover:text-yellow-600 transition-all font-semibold mt-2 group"
                  >
                    ¿Cómo funciona? <span className="text-yellow-400 group-hover:text-yellow-500 transition-all">♥️</span>
                  </button>
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
        </main>
        <Footer />
      </div>
    );
  }

  // Pantalla de espera de aprobación de admin
  if (authStep === 'awaitingAdminApproval') {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <CustomModal />
          <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4 flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full text-center border-b-8 border-orange-400 animate-in zoom-in duration-500">
              <div className="inline-block p-3 bg-orange-100 rounded-2xl shadow-lg mb-6 rotate-3">
                <AlertCircle className="w-12 h-12 text-orange-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-4">Cuenta en Revisión</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Tu cuenta ha sido creada exitosamente, pero aún está pendiente de aprobación por parte de nuestro equipo de administración para verificar tu edad.
              </p>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded mb-6 text-left">
                <h3 className="font-bold text-orange-900 mb-3">¿Cómo acelerar el proceso?</h3>
                <ul className="text-sm text-orange-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-lg">📍</span>
                    <span><strong>Opción 1:</strong> Ve a Punto Vuela con tu DNI o documento de identidad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lg">📧</span>
                    <span><strong>Opción 2:</strong> Envía una foto clara de tu DNI a <strong>puntovuelacuevas@gmail.com</strong> indicando que deseas verificar tu edad</span>
                  </li>
                </ul>
              </div>

              <p className="text-gray-500 text-sm mb-6">
                Nos pondremos en contacto contigo cuando tu cuenta haya sido aprobada. Generalmente esto ocurre en 24-48 horas.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setAuthStep('login')}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-xl font-bold transition-all shadow-lg"
                >
                  Volver a Iniciar Sesión
                </button>
                <button
                  onClick={() => setAuthStep('howItWorks')}
                  className="w-full border-2 border-gray-300 hover:border-yellow-400 text-gray-600 hover:text-yellow-600 py-3 rounded-xl font-bold transition-all"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Pantalla de restablecer contraseña (nueva password)
  if (authStep === 'resetPassword') {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <CustomModal />
          <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4">
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
        </main>
        <Footer />
      </div>
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
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <CustomModal />
          <div className="bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
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
        </main>
        <Footer />
      </div>
    );
  }

  // Dashboard para Usuario (necesita ayuda)
  if (userProfile && userProfile.type === 'user') {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <CustomModal />
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
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

              <div className="mb-6 text-center">
                <button
                  onClick={() => setAuthStep('howItWorks')}
                  className="text-base text-yellow-500 hover:text-yellow-600 transition-all font-semibold group"
                >
                  ¿Cómo funciona? <span className="text-yellow-400 group-hover:text-yellow-500 transition-all">♥️</span>
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
                      {getPredefinedLocations().map(loc => (
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
                    disabled={isCreatingRequest}
                    className={`w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-xl shadow-green-100 flex items-center justify-center gap-2 ${isCreatingRequest ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    {isCreatingRequest ? 'Enviando...' : 'Confirmar y Enviar Solicitud'}
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
                                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold transition-all shadow-md transform hover:scale-105 flex items-center justify-center gap-2 relative"
                                >
                                  💬 Abrir Chat
                                  {unreadNotifications.has(req.id) && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full animate-bounce flex items-center justify-center border-2 border-white shadow-sm z-50">
                                      <span className="w-2 h-2 bg-white rounded-full"></span>
                                    </span>
                                  )}
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
            <ChatWindow
              showChat={showChat}
              activeChatId={activeChatId}
              userProfile={userProfile}
              helpRequests={helpRequests}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              setShowChat={setShowChat}
              setActiveChatId={setActiveChatId}
              handleSendMessage={handleSendMessage}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              isSendingMessage={isSendingMessage}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Dashboard para Voluntario
  if (userProfile && userProfile.type === 'volunteer') {
    const pendingRequests = helpRequests.filter(req => req.status === 'pending');
    const hasActiveHelp = myHelps.filter(h => h.status === 'accepted').length > 0;

    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <CustomModal />
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
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

              <div className="mb-6 text-center">
                <button
                  onClick={() => setAuthStep('howItWorks')}
                  className="text-base text-yellow-500 hover:text-yellow-600 transition-all font-semibold group"
                >
                  ¿Cómo funciona? <span className="text-yellow-400 group-hover:text-yellow-500 transition-all">♥️</span>
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
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-lg font-semibold transition-all shadow-md transform hover:scale-105 flex items-center justify-center gap-2 relative"
                              >
                                💬 Chat
                                {unreadNotifications.has(help.id) && (
                                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full animate-bounce flex items-center justify-center border-2 border-white shadow-sm z-50">
                                    <span className="w-2 h-2 bg-white rounded-full"></span>
                                  </span>
                                )}
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
            <ChatWindow
              showChat={showChat}
              activeChatId={activeChatId}
              userProfile={userProfile}
              helpRequests={helpRequests}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              setShowChat={setShowChat}
              setActiveChatId={setActiveChatId}
              handleSendMessage={handleSendMessage}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              isSendingMessage={isSendingMessage}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Panel de Login Admin
  if (authStep === 'adminLogin') {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <CustomModal />
          <div className="bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-4 flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-md w-full text-center border-b-8 border-orange-500 animate-in zoom-in duration-500">
              <div className="inline-block p-3 bg-orange-100 rounded-2xl shadow-lg mb-6 rotate-3">
                <Users className="w-12 h-12 text-orange-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Panel de Admin</h2>
              <p className="text-gray-600 mb-6">Inicia sesión para gestionar usuarios</p>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario</label>
                  <input
                    type="text"
                    value={adminCredentials.username}
                    onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:outline-none bg-gray-50 transition-all"
                    placeholder="admin"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
                  <input
                    type="password"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl focus:border-orange-500 focus:outline-none bg-gray-50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {adminError && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center font-bold">
                    {adminError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={adminLoading}
                  className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${adminLoading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-105 shadow-orange-200'
                    }`}
                >
                  {adminLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
              </form>

              <button
                onClick={() => setAuthStep('login')}
                className="mt-6 text-orange-600 hover:text-orange-700 font-bold"
              >
                ← Volver
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Panel de Administración
  if (authStep === 'adminPanel' && adminToken) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900">
        <main className="flex-grow">
          <CustomModal />
          <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-black text-white">Panel de Admin</h1>
              </div>
              <button
                onClick={handleAdminLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl font-black text-orange-500 mb-2">{pendingUsers.length}</div>
                <p className="text-gray-600 font-semibold">Usuarios Pendientes</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl font-black text-green-500 mb-2">{approvedUsers.length}</div>
                <p className="text-gray-600 font-semibold">Usuarios Aprobados</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl font-black text-blue-500 mb-2">{pendingUsers.length + approvedUsers.length}</div>
                <p className="text-gray-600 font-semibold">Total de Usuarios</p>
              </div>
            </div>

            {/* Tabla de Usuarios Pendientes */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Usuarios Pendientes de Aprobación</h2>

              {isLoadingUsers ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 font-semibold">Cargando usuarios...</p>
                </div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8 bg-green-50 rounded-lg border-2 border-green-200">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold">¡No hay usuarios pendientes!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-3 px-4 font-black text-gray-900">Nombre</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Edad</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Localidad</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha Registro</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((user: any) => (
                        <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4 font-semibold text-gray-900">{user.nombre_completo}</td>
                          <td className="py-4 px-4 text-gray-600 text-sm">{user.email}</td>
                          <td className="py-4 px-4 text-gray-600">{user.edad} años</td>
                          <td className="py-4 px-4 text-gray-600">{user.localidad}</td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${user.rol_activo === 'voluntario'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                              }`}>
                              {user.rol_activo === 'voluntario' ? '👤 Voluntario' : '🛟 Solicitante'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600 text-sm">{user.fecha_registro}</td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleApproveUser(user.id)}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105"
                              >
                                ✓ Aprobar
                              </button>
                              <button
                                onClick={() => handleDenyUser(user.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition-all transform hover:scale-105"
                              >
                                ✕ Denegar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Tabla de Usuarios Aprobados */}
            {approvedUsers.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-black text-gray-900 mb-6">Usuarios Aprobados ({approvedUsers.length})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-3 px-4 font-black text-gray-900">Nombre</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Edad</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Rol</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Aprobado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedUsers.map((user: any) => (
                        <tr key={user.id} className="border-b border-gray-200 bg-green-50 hover:bg-green-100 transition-colors">
                          <td className="py-4 px-4 font-semibold text-gray-900">{user.nombre_completo}</td>
                          <td className="py-4 px-4 text-gray-600 text-sm">{user.email}</td>
                          <td className="py-4 px-4 text-gray-600">{user.edad} años</td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${user.rol_activo === 'voluntario'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                              }`}>
                              {user.rol_activo === 'voluntario' ? '👤 Voluntario' : '🛟 Solicitante'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                              ✓ Aprobado
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return null;
};

export default App;
