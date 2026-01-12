const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface Usuario {
    id?: number;
    nombre_usuario: string;
    email: string;
    password_hash: string;
    nombre_completo: string;
    es_voluntario: boolean;
    telefono?: string;
    edad?: number | null;
    genero?: string;
}

export interface Trayecto {
    id?: number;
    solicitante_id: number;
    titulo: string;
    descripcion: string;
    ubicacion_origen: string;
    ubicacion_destino: string;
    fecha_necesaria: string;
    estado: 'PENDIENTE' | 'ACEPTADO' | 'COMPLETADO' | 'CANCELADO';
    voluntario_id?: number | null;
}

export interface Mensaje {
    id?: number;
    trayecto_id: number;
    emisor_id: number;
    contenido: string;
}

// Usuarios
export const crearUsuario = async (usuario: Usuario) => {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario)
    });
    return response.json();
};

export const obtenerUsuarios = async () => {
    const response = await fetch(`${API_BASE_URL}/usuarios`);
    return response.json();
};

export const obtenerUsuario = async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`);
    return response.json();
};

// Trayectos
export const crearTrayecto = async (trayecto: Trayecto) => {
    const response = await fetch(`${API_BASE_URL}/trayectos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trayecto)
    });
    return response.json();
};

export const obtenerTrayectos = async () => {
    const response = await fetch(`${API_BASE_URL}/trayectos`);
    return response.json();
};

export const obtenerTrayecto = async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/trayectos/${id}`);
    return response.json();
};

export const actualizarTrayecto = async (id: number, datos: Partial<Trayecto>) => {
    const response = await fetch(`${API_BASE_URL}/trayectos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    });
    return response.json();
};

// Mensajes
export const crearMensaje = async (mensaje: Mensaje) => {
    const response = await fetch(`${API_BASE_URL}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mensaje)
    });
    return response.json();
};

export const obtenerMensajesPorTrayecto = async (trayectoId: number) => {
    const response = await fetch(`${API_BASE_URL}/mensajes/trayecto/${trayectoId}`);
    return response.json();
};

// Autenticación
export interface RegisterData {
    nombre_completo: string;
    email: string;
    password: string;
    edad?: number;
    genero?: string;
    localidad?: string;
    rol: 'voluntario' | 'solicitante';
}

export interface LoginData {
    email: string;
    password: string;
}

export const register = async (data: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
            message: errorData.message || 'Error en el registro',
            status: response.status
        };
    }

    return response.json();
};

export const login = async (data: LoginData) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
            message: errorData.message || 'Error en el login',
            status: response.status
        };
    }

    return response.json();
};

export const updateUserRol = async (id: number, rol: 'voluntario' | 'solicitante') => {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}/rol`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol })
    });
    return response.json();
};

export const forgotPassword = async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { message: errorData.message || 'Error en la solicitud' };
    }
    return response.json();
};

export const resetPassword = async (token: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { message: errorData.message || 'Error al restablecer contraseña' };
    }
    return response.json();
};

export const getRanking = async () => {
    const response = await fetch(`${API_BASE_URL}/ranking`);
    return response.json();
};


