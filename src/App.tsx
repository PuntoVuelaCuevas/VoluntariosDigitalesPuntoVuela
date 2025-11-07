import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Users, User, Heart, Clock, CheckCircle, Navigation, LogOut, Edit } from 'lucide-react';
import './index.css';



const App = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [registrationStep, setRegistrationStep] = useState('type');
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    type: null
  });
  const [helpRequests, setHelpRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myHelps, setMyHelps] = useState([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({
    category: '',
    description: ''
  });
  const [location, setLocation] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  const predefinedLocations = [
    { 
      id: 'loc1', 
      name: 'Punto Vuela',
      lat: 36.87617075381733, 
      lng: -5.045460278303508,
      icon: '🏢',
      color: 'blue'
    },
    { 
      id: 'loc2', 
      name: 'Rafael Alberti',
      lat: 36.87199299684786, 
      lng: -5.045088258193824,
      icon: '🏥',
      color: 'red'
    },
    { 
      id: 'loc3', 
      name: 'Nacimiento',
      lat: 37.267813332388805, 
      lng: -4.414889758193826,
      icon: '🏛️',
      color: 'green'
    }
  ];

  const helpCategories = [
    { id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: 'green' },
    { id: 'social', label: 'Redes Sociales', icon: '📱', color: 'blue' },
    { id: 'phone', label: 'Teléfono', icon: '📞', color: 'purple' },
    { id: 'apps', label: 'Aplicaciones', icon: '📲', color: 'orange' }
  ];

  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const completeRegistration = () => {
    if (formData.name && formData.gender && formData.age && formData.type) {
      const profile = {
        name: formData.name,
        gender: formData.gender,
        age: formData.age,
        type: formData.type,
        registeredAt: new Date().toISOString()
      };
      setUserProfile(profile);
      localStorage.setItem('userProfile', JSON.stringify(profile));
    }
  };

  const logout = () => {
    localStorage.removeItem('userProfile');
    setUserProfile(null);
    setFormData({ name: '', gender: '', age: '', type: null });
    setRegistrationStep('type');
    setMyRequests([]);
    setMyHelps([]);
  };

  const createHelpRequest = () => {
    if (requestData.category && requestData.description.trim() && selectedLocationId) {
      const selectedLoc = predefinedLocations.find(loc => loc.id === selectedLocationId);
      const newRequest = {
        id: Date.now(),
        userName: userProfile.name,
        userGender: userProfile.gender,
        userAge: userProfile.age,
        category: requestData.category,
        description: requestData.description,
        location: selectedLoc,
        timestamp: new Date().toLocaleString('es-ES'),
        status: 'pending',
        volunteer: null
      };
      setHelpRequests([...helpRequests, newRequest]);
      setMyRequests([...myRequests, newRequest]);
      setRequestData({ category: '', description: '' });
      setSelectedLocationId(null);
      setShowRequestForm(false);
    }
  };

  const acceptHelp = (requestId) => {
    const updatedRequests = helpRequests.map(req => {
      if (req.id === requestId && req.status === 'pending') {
        const updatedReq = {
          ...req,
          status: 'accepted',
          volunteer: userProfile.name
        };
        setMyHelps([...myHelps, updatedReq]);
        return updatedReq;
      }
      return req;
    });
    setHelpRequests(updatedRequests);
  };

  const completeHelp = (requestId) => {
    const updatedRequests = helpRequests.map(req => {
      if (req.id === requestId) {
        return { ...req, status: 'completed' };
      }
      return req;
    });
    setHelpRequests(updatedRequests);
    
    const updatedMyHelps = myHelps.map(req => {
      if (req.id === requestId) {
        return { ...req, status: 'completed' };
      }
      return req;
    });
    setMyHelps(updatedMyHelps);
  };

  const getDistance = (loc1, loc2) => {
    if (!loc1 || !loc2) return 'N/A';
    const R = 6371;
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const getCategoryColor = (categoryId) => {
    const category = helpCategories.find(c => c.id === categoryId);
    return category ? category.color : 'gray';
  };

  const getCategoryLabel = (categoryId) => {
    const category = helpCategories.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.label}` : categoryId;
  };

  // Pantalla de registro
  if (!userProfile) {
    if (registrationStep === 'type') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
          <div className="max-w-md mx-auto pt-12">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <img src="./src/assets/Logo Punto Vuela.jpg" width="100px" alt="" />
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Voluntarios Digitales Punto Vuela</h1>
                <p className="text-gray-600">Conectando personas que necesitan ayuda con voluntarios</p>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">¿Cómo quieres registrarte?</h2>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setFormData({ ...formData, type: 'user' });
                    setRegistrationStep('form');
                  }}
                  className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                >
                  <User className="w-5 h-5" />
                  Necesito Ayuda
                </button>

                <button
                  onClick={() => {
                    setFormData({ ...formData, type: 'volunteer' });
                    setRegistrationStep('form');
                  }}
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

    if (registrationStep === 'form') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-md mx-auto pt-12">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  formData.type === 'user' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {formData.type === 'user' ? 
                    <User className="w-8 h-8 text-blue-600" /> : 
                    <Users className="w-8 h-8 text-green-600" />
                  }
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Completa tu Registro</h2>
                <p className="text-gray-600">
                  {formData.type === 'user' ? 'Usuario que solicita ayuda' : 'Voluntario solidario'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Escribe tu nombre"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sexo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Hombre', 'Mujer', 'Otro'].map(gender => (
                      <button
                        key={gender}
                        onClick={() => handleInputChange('gender', gender)}
                        className={`py-3 rounded-lg font-medium transition-all ${
                          formData.gender === gender
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Edad</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="Escribe tu edad"
                    min="1"
                    max="120"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setRegistrationStep('type')}
                    className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={completeRegistration}
                    disabled={!formData.name || !formData.gender || !formData.age}
                    className={`flex-1 ${formData.type === 'user' ? 'bg-black hover:bg-gray-800' : 'bg-yellow-500 hover:bg-yellow-600'} disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold transition-all`}
                  >
                    Completar Registro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Pantalla de usuario (necesita ayuda)
  if (userProfile && userProfile.type === 'user') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Hola, {userProfile.name}</h2>
                <p className="text-gray-300">{userProfile.gender} • {userProfile.age} años • Usuario</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
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
                <label className="block text-sm font-medium text-gray-300 mb-3">¿Dónde necesitas ayuda?</label>
                <div className="grid grid-cols-2 gap-3">
                  {helpCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setRequestData({ ...requestData, category: cat.id })}
                      className={`py-4 px-4 rounded-xl text-center transition-all transform hover:scale-105 ${
                        requestData.category === cat.id
                          ? 'bg-black text-white shadow-lg ring-2 ring-gray-600'
                          : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-2 border-gray-600'
                      }`}
                    >
                      <div className="text-3xl mb-2">{cat.icon}</div>
                      <div className="font-semibold text-sm">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-3">Selecciona tu ubicación</label>
                <div className="space-y-2">
                  {predefinedLocations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`w-full py-4 px-4 rounded-xl text-left transition-all transform hover:scale-102 ${
                        selectedLocationId === loc.id
                          ? 'bg-black text-white shadow-lg ring-2 ring-gray-600'
                          : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-2 border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{loc.icon}</div>
                        <div className="flex-1">
                          <div className="font-semibold">{loc.name}</div>
                          <div className={`text-xs ${selectedLocationId === loc.id ? 'text-gray-300' : 'text-gray-400'}`}>
                            {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Describe tu situación</label>
                <textarea
                  value={requestData.description}
                  onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                  placeholder="Explica con detalle qué tipo de ayuda necesitas..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg h-32 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="px-6 bg-gray-700 hover:bg-gray-600 text-gray-200 py-3 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={createHelpRequest}
                  disabled={!requestData.category || !requestData.description.trim() || !selectedLocationId}
                  className="flex-1 bg-black hover:bg-gray-900 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold"
                >
                  Enviar Solicitud
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Mis Solicitudes</h3>
            {myRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No has solicitado ayuda todavía</p>
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
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            req.status === 'pending' ? 'bg-yellow-600 text-white' :
                            req.status === 'accepted' ? 'bg-blue-600 text-white' :
                            'bg-green-600 text-white'
                          }`}>
                            {req.status === 'pending' ? 'Pendiente' :
                             req.status === 'accepted' ? 'En camino' : 'Completada'}
                          </span>
                        </div>
                        <p className="text-white font-medium mb-1">{req.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {req.timestamp}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-xl">{req.location.icon}</span>
                            <span className="font-medium">{req.location.name}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {req.volunteer && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <p className="text-sm text-yellow-400 font-medium">
                          ✓ {req.volunteer} va en tu ayuda
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de voluntario
  if (userProfile && userProfile.type === 'volunteer') {
    const pendingRequests = helpRequests.filter(req => req.status === 'pending');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-4 border-yellow-500">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Hola, {userProfile.name}</h2>
                <p className="text-gray-600">{userProfile.gender} • {userProfile.age} años • Voluntario</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
            <div className="text-center bg-yellow-500 rounded-lg p-4">
              <p className="text-4xl font-bold text-black">{pendingRequests.length}</p>
              <p className="text-black font-semibold">Solicitudes pendientes</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-4 border-yellow-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Solicitudes de Ayuda Activas</h3>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay solicitudes de ayuda en este momento</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="border-2 border-yellow-400 bg-yellow-50 rounded-lg p-4 hover:border-yellow-500 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black text-white">
                            {getCategoryLabel(req.category)}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800 mb-1">
                          {req.userName} ({req.userGender}, {req.userAge} años) necesita ayuda
                        </p>
                        <p className="text-gray-600 mb-2">{req.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {req.timestamp}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-xl">{req.location.icon}</span>
                            <span className="font-medium">{req.location.name}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => acceptHelp(req.id)}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <Navigation className="w-5 h-5" />
                      Voy en Camino
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-yellow-500">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Mis Ayudas Activas</h3>
            {myHelps.filter(h => h.status === 'accepted').length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No has aceptado ninguna ayuda todavía</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myHelps.filter(h => h.status === 'accepted').map(req => (
                  <div key={req.id} className="border-2 border-yellow-400 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black text-white">
                            {getCategoryLabel(req.category)}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-800 mb-1">
                          Ayudando a {req.userName} ({req.userGender}, {req.userAge} años)
                        </p>
                        <p className="text-gray-600 mb-2">{req.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-2">
                            <span className="text-xl">{req.location.icon}</span>
                            <span className="font-medium">{req.location.name}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => completeHelp(req.id)}
                      className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Marcar como Completada
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default App;