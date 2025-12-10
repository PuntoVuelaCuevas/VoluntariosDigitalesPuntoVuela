const API_BASE_URL = 'http://localhost:3000/api/v1';

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
