-- Enums (según el modelo de datos de la consigna)
CREATE TYPE estados_usuarios AS ENUM ('ACTIVO','BAJA');
CREATE TYPE roles_usuarios AS ENUM ('MEDICO','PACIENTE','ADMINISTRADOR');
CREATE TYPE estados_reservas AS ENUM ('ACTIVO','ATENDIDO','AUSENTE','CANCELADO');

-- Tabla usuarios (médicos, pacientes y administradores viven todos acá, diferenciados por "rol")
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    documento TEXT NOT NULL UNIQUE,
    apellidos TEXT NOT NULL,
    nombres TEXT NOT NULL,
    email TEXT NOT NULL,
    clave TEXT NOT NULL,
    estado estados_usuarios NOT NULL,
    rol roles_usuarios NOT NULL
);

-- Tabla medicos: datos propios de los usuarios con rol MEDICO (matrícula y valor de consulta)
CREATE TABLE medicos (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    matricula INT NOT NULL UNIQUE,
    valor_consulta INT NOT NULL,
    CONSTRAINT fk_medicos_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id)
);

-- Tabla reservas: turnos entre un medico y un usuario con rol PACIENTE
CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    id_medico INT NOT NULL,
    id_paciente INT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL,
    estado estados_reservas NOT NULL,
    valor_consulta INT NOT NULL,
    CONSTRAINT fk_reservas_medico
        FOREIGN KEY (id_medico)
        REFERENCES medicos (id),
    CONSTRAINT fk_reservas_paciente
        FOREIGN KEY (id_paciente)
        REFERENCES usuarios (id)
);

-- pgcrypto: para poder cargar contraseñas ya hasheadas en los inserts de prueba
-- (crypt(...,'bf') genera el mismo formato de hash que usa la librería bcrypt en el backend)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Usuario administrador de prueba -> documento: 00000001 / clave: admin123
INSERT INTO usuarios (documento, apellidos, nombres, email, clave, estado, rol) VALUES
('00000001', 'Admin', 'Sistema', 'admin@clinica.com', crypt('admin123', gen_salt('bf', 10)), 'ACTIVO', 'ADMINISTRADOR');

-- Usuario médico de prueba -> documento: 20111222 / clave: medico123
INSERT INTO usuarios (documento, apellidos, nombres, email, clave, estado, rol) VALUES
('20111222', 'Gomez', 'Laura', 'lgomez@clinica.com', crypt('medico123', gen_salt('bf', 10)), 'ACTIVO', 'MEDICO');

INSERT INTO medicos (id_usuario, matricula, valor_consulta)
SELECT id, 12345, 15000 FROM usuarios WHERE documento = '20111222';

-- Usuario paciente de prueba -> documento: 30222333 / clave: paciente123
INSERT INTO usuarios (documento, apellidos, nombres, email, clave, estado, rol) VALUES
('30222333', 'Perez', 'Juan', 'jperez@gmail.com', crypt('paciente123', gen_salt('bf', 10)), 'ACTIVO', 'PACIENTE');
