-- EduGestion Web | Sprint II | MySQL 8.0.16+
-- Creado automaticamente por npm run setup / npm run db:init. No requiere Workbench.
CREATE DATABASE IF NOT EXISTS edugestion_web CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edugestion_web;

CREATE TABLE IF NOT EXISTS roles (
 id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 nombre VARCHAR(25) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuarios (
 id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 rol_id TINYINT UNSIGNED NOT NULL,
 correo VARCHAR(150) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 activo BOOLEAN NOT NULL DEFAULT TRUE,
 ultimo_acceso DATETIME NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estudiantes (
 id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 usuario_id INT UNSIGNED NOT NULL UNIQUE,
 carnet VARCHAR(30) NOT NULL UNIQUE,
 nombres VARCHAR(90) NOT NULL,
 apellidos VARCHAR(90) NOT NULL,
 fecha_nacimiento DATE NULL,
 telefono VARCHAR(20) NULL,
 direccion VARCHAR(255) NULL,
 fecha_ingreso DATE NULL,
 CONSTRAINT fk_estudiantes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS docentes (
 id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 usuario_id INT UNSIGNED NOT NULL UNIQUE,
 codigo_docente VARCHAR(30) NOT NULL UNIQUE,
 nombres VARCHAR(90) NOT NULL,
 apellidos VARCHAR(90) NOT NULL,
 especialidad VARCHAR(100) NULL,
 telefono VARCHAR(20) NULL,
 CONSTRAINT fk_docentes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ciclos_lectivos (
 id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 nombre VARCHAR(90) NOT NULL UNIQUE,
 fecha_inicio DATE NOT NULL,
 fecha_fin DATE NOT NULL,
 estado ENUM('ABIERTO','CERRADO') NOT NULL DEFAULT 'ABIERTO',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT chk_ciclo_fechas CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS asignaturas (
 id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 codigo VARCHAR(20) NOT NULL UNIQUE,
 nombre VARCHAR(120) NOT NULL,
 descripcion TEXT NULL,
 activa BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS secciones (
 id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 ciclo_id INT UNSIGNED NOT NULL,
 nombre VARCHAR(40) NOT NULL,
 nivel VARCHAR(60) NOT NULL,
 jornada VARCHAR(30) NOT NULL,
 activa BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE KEY uq_seccion_ciclo_nombre (ciclo_id, nombre),
 CONSTRAINT fk_secciones_ciclo FOREIGN KEY (ciclo_id) REFERENCES ciclos_lectivos(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS matriculas (
 id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 estudiante_id INT UNSIGNED NOT NULL,
 seccion_id INT UNSIGNED NOT NULL,
 ciclo_id INT UNSIGNED NOT NULL,
 fecha_matricula DATE NOT NULL,
 estado ENUM('ACTIVA','RETIRADA') NOT NULL DEFAULT 'ACTIVA',
 UNIQUE KEY uq_matricula_estudiante_ciclo (estudiante_id, ciclo_id),
 KEY ix_matricula_seccion (seccion_id),
 CONSTRAINT fk_matriculas_estudiante FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
 CONSTRAINT fk_matriculas_seccion FOREIGN KEY (seccion_id) REFERENCES secciones(id),
 CONSTRAINT fk_matriculas_ciclo FOREIGN KEY (ciclo_id) REFERENCES ciclos_lectivos(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS asignaciones_docentes (
 id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 docente_id INT UNSIGNED NOT NULL,
 asignatura_id INT UNSIGNED NOT NULL,
 seccion_id INT UNSIGNED NOT NULL,
 ciclo_id INT UNSIGNED NOT NULL,
 activa BOOLEAN NOT NULL DEFAULT TRUE,
 UNIQUE KEY uq_asignacion_seccion_asignatura (seccion_id, asignatura_id),
 CONSTRAINT fk_asignaciones_docente FOREIGN KEY (docente_id) REFERENCES docentes(id),
 CONSTRAINT fk_asignaciones_asignatura FOREIGN KEY (asignatura_id) REFERENCES asignaturas(id),
 CONSTRAINT fk_asignaciones_seccion FOREIGN KEY (seccion_id) REFERENCES secciones(id),
 CONSTRAINT fk_asignaciones_ciclo FOREIGN KEY (ciclo_id) REFERENCES ciclos_lectivos(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS periodos_evaluacion (
 id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 ciclo_id INT UNSIGNED NOT NULL,
 nombre VARCHAR(50) NOT NULL,
 ponderacion DECIMAL(5,2) NOT NULL,
 fecha_inicio DATE NOT NULL,
 fecha_fin DATE NOT NULL,
 estado ENUM('ABIERTO','CERRADO') NOT NULL DEFAULT 'ABIERTO',
 UNIQUE KEY uq_periodo_ciclo_nombre (ciclo_id, nombre),
 CONSTRAINT fk_periodo_ciclo FOREIGN KEY (ciclo_id) REFERENCES ciclos_lectivos(id),
 CONSTRAINT chk_periodo_peso CHECK (ponderacion > 0 AND ponderacion <= 100),
 CONSTRAINT chk_periodo_fechas CHECK (fecha_fin >= fecha_inicio)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS calificaciones (
 id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
 matricula_id INT UNSIGNED NOT NULL,
 asignacion_id INT UNSIGNED NOT NULL,
 periodo_id INT UNSIGNED NOT NULL,
 nota DECIMAL(4,2) NOT NULL,
 observacion VARCHAR(255) NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_calificacion (matricula_id, asignacion_id, periodo_id),
 CONSTRAINT chk_nota CHECK (nota >= 0 AND nota <= 10),
 CONSTRAINT fk_calif_matricula FOREIGN KEY (matricula_id) REFERENCES matriculas(id),
 CONSTRAINT fk_calif_asignacion FOREIGN KEY (asignacion_id) REFERENCES asignaciones_docentes(id),
 CONSTRAINT fk_calif_periodo FOREIGN KEY (periodo_id) REFERENCES periodos_evaluacion(id)
) ENGINE=InnoDB;

INSERT IGNORE INTO roles(id,nombre) VALUES (1,'ADMINISTRADOR'),(2,'DOCENTE'),(3,'ESTUDIANTE');
