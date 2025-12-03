-- database/init.sql
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Crear tablas base
CREATE TABLE IF NOT EXISTS Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'admin','doctor','patient'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Patients (
    patient_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birthdate DATE NULL,
    phone VARCHAR(30) NULL,
    address VARCHAR(250) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Doctors (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    doc_license VARCHAR(50) NULL,
    phone VARCHAR(30) NULL,
    bio TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Specialties (
    specialty_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS DoctorSpecialties (
    doctor_id INT NOT NULL,
    specialty_id INT NOT NULL,
    PRIMARY KEY (doctor_id, specialty_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (specialty_id) REFERENCES Specialties(specialty_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS DoctorSchedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    weekday TINYINT NOT NULL, -- 0=Sunday .. 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_min INT NOT NULL DEFAULT 30,
    FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'scheduled','confirmed','attended','cancelled','rescheduled'
    reason TEXT NULL,
    created_by_user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    channel VARCHAR(50) NULL,
    FOREIGN KEY (patient_id) REFERENCES Patients(patient_id),
    FOREIGN KEY (doctor_id) REFERENCES Doctors(doctor_id),
    FOREIGN KEY (created_by_user_id) REFERENCES Users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS AppointmentHistory (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'create','cancel','reschedule','update','status_change'
    old_value TEXT NULL,
    new_value TEXT NULL,
    event_by_user_id INT NULL,
    event_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (event_by_user_id) REFERENCES Users(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    appointment_id INT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (appointment_id) REFERENCES Appointments(appointment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- 2. Vistas optimizadas
-- Vista: calendario por médico (sólo citas activas)
CREATE OR REPLACE VIEW vw_DoctorCalendar AS
SELECT 
    a.appointment_id, 
    a.doctor_id, 
    a.patient_id, 
    p.first_name AS patient_first_name, 
    p.last_name AS patient_last_name,
    a.start_datetime, 
    a.end_datetime, 
    a.status, 
    a.reason, 
    a.channel
FROM Appointments a
JOIN Patients p ON a.patient_id = p.patient_id
WHERE a.status != 'cancelled';

-- Vista: Citas completas con información de paciente y médico
CREATE OR REPLACE VIEW vw_AppointmentsComplete AS
SELECT 
    a.appointment_id,
    a.patient_id,
    a.doctor_id,
    a.start_datetime,
    a.end_datetime,
    a.status,
    a.reason,
    a.created_by_user_id,
    a.created_at,
    a.updated_at,
    a.channel,
    p.first_name AS patient_first_name,
    p.last_name AS patient_last_name,
    p.phone AS patient_phone,
    p.birthdate AS patient_birthdate,
    d.first_name AS doctor_first_name,
    d.last_name AS doctor_last_name,
    d.phone AS doctor_phone,
    d.doc_license AS doctor_license,
    GROUP_CONCAT(s.name SEPARATOR ', ') AS doctor_specialties
FROM Appointments a
LEFT JOIN Patients p ON a.patient_id = p.patient_id
LEFT JOIN Doctors d ON a.doctor_id = d.doctor_id
LEFT JOIN DoctorSpecialties ds ON d.doctor_id = ds.doctor_id
LEFT JOIN Specialties s ON ds.specialty_id = s.specialty_id
GROUP BY a.appointment_id;

-- Vista: Pacientes con información de usuario
CREATE OR REPLACE VIEW vw_PatientsComplete AS
SELECT 
    p.patient_id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.birthdate,
    p.phone,
    p.address,
    p.created_at,
    u.email,
    u.username,
    u.role
FROM Patients p
JOIN Users u ON p.user_id = u.user_id;

-- Vista: Doctores con especialidades y usuario
CREATE OR REPLACE VIEW vw_DoctorsComplete AS
SELECT 
    d.doctor_id,
    d.user_id,
    d.first_name,
    d.last_name,
    d.doc_license,
    d.phone,
    d.bio,
    d.created_at,
    u.email,
    u.username,
    u.role,
    GROUP_CONCAT(s.name SEPARATOR ', ') AS specialties,
    GROUP_CONCAT(s.specialty_id SEPARATOR ',') AS specialty_ids
FROM Doctors d
JOIN Users u ON d.user_id = u.user_id
LEFT JOIN DoctorSpecialties ds ON d.doctor_id = ds.doctor_id
LEFT JOIN Specialties s ON ds.specialty_id = s.specialty_id
GROUP BY d.doctor_id;

-- Vista: Reporte de citas por estado
CREATE OR REPLACE VIEW vw_AppointmentsByStatus AS
SELECT 
    status,
    COUNT(*) AS total_count,
    COUNT(CASE WHEN DATE(start_datetime) = CURDATE() THEN 1 END) AS today_count,
    COUNT(CASE WHEN DATE(start_datetime) >= CURDATE() THEN 1 END) AS upcoming_count,
    COUNT(CASE WHEN DATE(start_datetime) < CURDATE() AND status != 'cancelled' THEN 1 END) AS past_count
FROM Appointments
GROUP BY status;

-- Vista: Notificaciones no leídas
CREATE OR REPLACE VIEW vw_UnreadNotifications AS
SELECT 
    n.notification_id,
    n.user_id,
    n.appointment_id,
    n.title,
    n.message,
    n.is_read,
    n.created_at,
    u.email,
    u.role
FROM Notifications n
JOIN Users u ON n.user_id = u.user_id
WHERE n.is_read = 0
ORDER BY n.created_at DESC;

-- Vista: Disponibilidad de médicos
CREATE OR REPLACE VIEW vw_DoctorAvailability AS
SELECT 
    d.doctor_id,
    d.first_name,
    d.last_name,
    ds.weekday,
    ds.start_time,
    ds.end_time,
    ds.slot_duration_min,
    COUNT(DISTINCT a.appointment_id) AS booked_slots,
    TIMESTAMPDIFF(MINUTE, ds.start_time, ds.end_time) / ds.slot_duration_min AS total_slots
FROM Doctors d
JOIN DoctorSchedules ds ON d.doctor_id = ds.doctor_id
LEFT JOIN Appointments a ON d.doctor_id = a.doctor_id 
    AND WEEKDAY(a.start_datetime) = ds.weekday
    AND TIME(a.start_datetime) >= ds.start_time 
    AND TIME(a.start_datetime) < ds.end_time
    AND a.status != 'cancelled'
GROUP BY d.doctor_id, ds.weekday, ds.start_time, ds.end_time, ds.slot_duration_min;

-- 3. Procedimientos almacenados
DELIMITER //

-- Función de comprobación de solapamiento
CREATE FUNCTION fn_HasOverlap(
    p_doctor_id INT,
    p_start DATETIME,
    p_end DATETIME,
    p_exclude_appointment_id INT
)
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_exists BOOLEAN DEFAULT FALSE;
    
    SELECT COUNT(*) > 0 INTO v_exists
    FROM Appointments a
    WHERE a.doctor_id = p_doctor_id
      AND a.status <> 'cancelled'
      AND (
          (p_start < a.end_datetime AND p_end > a.start_datetime)
      )
      AND (p_exclude_appointment_id IS NULL OR a.appointment_id <> p_exclude_appointment_id);
    
    RETURN v_exists;
END//

-- Procedimiento para crear cita
CREATE PROCEDURE sp_CreateAppointment(
    IN p_patient_id INT,
    IN p_doctor_id INT,
    IN p_start_datetime DATETIME,
    IN p_end_datetime DATETIME,
    IN p_reason TEXT,
    IN p_created_by_user_id INT,
    IN p_channel VARCHAR(50)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Verificar solapamiento
    IF fn_HasOverlap(p_doctor_id, p_start_datetime, p_end_datetime, NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El médico tiene otra cita en ese horario (solapamiento).';
    END IF;

    -- Insertar cita
    INSERT INTO Appointments(patient_id, doctor_id, start_datetime, end_datetime, reason, created_by_user_id, channel)
    VALUES (p_patient_id, p_doctor_id, p_start_datetime, p_end_datetime, p_reason, p_created_by_user_id, p_channel);

    SET @new_id = LAST_INSERT_ID();

    -- Insertar historial
    INSERT INTO AppointmentHistory(appointment_id, event_type, new_value, event_by_user_id)
    VALUES (@new_id, 'create', 
            CONCAT('start=', p_start_datetime, '|end=', p_end_datetime, '|reason=', COALESCE(p_reason, '')), 
            p_created_by_user_id);

    -- Crear notificaciones
    INSERT INTO Notifications(user_id, appointment_id, title, message)
    SELECT u.user_id, @new_id, 'Nueva cita agendada', 
           CONCAT('Cita agendada para ', DATE_FORMAT(p_start_datetime, '%Y-%m-%d %H:%i'))
    FROM Users u 
    WHERE u.user_id IN (
        (SELECT user_id FROM Patients WHERE patient_id = p_patient_id),
        (SELECT user_id FROM Doctors WHERE doctor_id = p_doctor_id)
    );

    COMMIT;
    
    SELECT @new_id AS appointment_id;
END//

-- Procedimiento para reprogramar cita
CREATE PROCEDURE sp_RescheduleAppointment(
    IN p_appointment_id INT,
    IN p_new_start DATETIME,
    IN p_new_end DATETIME,
    IN p_event_by_user_id INT,
    IN p_notes TEXT
)
BEGIN
    DECLARE v_doctor_id INT;
    DECLARE v_old_start DATETIME;
    DECLARE v_old_end DATETIME;
    DECLARE v_patient_user_id INT;
    DECLARE v_doctor_user_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Obtener datos actuales
    SELECT doctor_id, start_datetime, end_datetime 
    INTO v_doctor_id, v_old_start, v_old_end 
    FROM Appointments 
    WHERE appointment_id = p_appointment_id;
    
    -- Verificar solapamiento
    IF fn_HasOverlap(v_doctor_id, p_new_start, p_new_end, p_appointment_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El médico tiene otra cita en el nuevo horario (solapamiento).';
    END IF;
    
    -- Actualizar cita
    UPDATE Appointments
    SET start_datetime = p_new_start, 
        end_datetime = p_new_end, 
        status = 'rescheduled'
    WHERE appointment_id = p_appointment_id;

    -- Insertar historial
    INSERT INTO AppointmentHistory(appointment_id, event_type, old_value, new_value, event_by_user_id, notes)
    VALUES(p_appointment_id, 'reschedule', 
           CONCAT('start=', v_old_start, '|end=', v_old_end),
           CONCAT('start=', p_new_start, '|end=', p_new_end), 
           p_event_by_user_id, p_notes);

    -- Obtener IDs de usuario para notificaciones
    SELECT user_id INTO v_patient_user_id 
    FROM Patients 
    WHERE patient_id = (SELECT patient_id FROM Appointments WHERE appointment_id = p_appointment_id);
    
    SELECT user_id INTO v_doctor_user_id 
    FROM Doctors 
    WHERE doctor_id = v_doctor_id;

    -- Insertar notificaciones
    INSERT INTO Notifications(user_id, appointment_id, title, message)
    VALUES
    (v_patient_user_id, p_appointment_id, 'Cita reprogramada', 
     CONCAT('Nueva fecha: ', DATE_FORMAT(p_new_start, '%Y-%m-%d %H:%i'))),
    (v_doctor_user_id, p_appointment_id, 'Cita reprogramada', 
     CONCAT('Nueva fecha: ', DATE_FORMAT(p_new_start, '%Y-%m-%d %H:%i')));

    COMMIT;
END//

-- Procedimiento para actualizar estado de cita
CREATE PROCEDURE sp_UpdateAppointmentStatus(
    IN p_appointment_id INT,
    IN p_new_status VARCHAR(20),
    IN p_event_by_user_id INT,
    IN p_notes TEXT
)
BEGIN
    DECLARE v_old_status VARCHAR(20);
    DECLARE v_patient_user_id INT;
    DECLARE v_doctor_user_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Obtener estado actual
    SELECT status INTO v_old_status
    FROM Appointments
    WHERE appointment_id = p_appointment_id;
    
    -- Actualizar estado
    UPDATE Appointments
    SET status = p_new_status
    WHERE appointment_id = p_appointment_id;
    
    -- Insertar historial
    INSERT INTO AppointmentHistory(appointment_id, event_type, old_value, new_value, event_by_user_id, notes)
    VALUES(p_appointment_id, 'status_change', 
           CONCAT('status=', v_old_status),
           CONCAT('status=', p_new_status), 
           p_event_by_user_id, p_notes);
    
    -- Obtener IDs de usuario para notificaciones
    SELECT user_id INTO v_patient_user_id 
    FROM Patients 
    WHERE patient_id = (SELECT patient_id FROM Appointments WHERE appointment_id = p_appointment_id);
    
    SELECT user_id INTO v_doctor_user_id 
    FROM Doctors 
    WHERE doctor_id = (SELECT doctor_id FROM Appointments WHERE appointment_id = p_appointment_id);
    
    -- Insertar notificaciones si el estado cambia a cancelado
    IF p_new_status = 'cancelled' THEN
        INSERT INTO Notifications(user_id, appointment_id, title, message)
        VALUES
        (v_patient_user_id, p_appointment_id, 'Cita cancelada', 
         CONCAT('Su cita ha sido cancelada. Fecha original: ', DATE_FORMAT((SELECT start_datetime FROM Appointments WHERE appointment_id = p_appointment_id), '%Y-%m-%d %H:%i'))),
        (v_doctor_user_id, p_appointment_id, 'Cita cancelada', 
         CONCAT('Una cita ha sido cancelada. Fecha original: ', DATE_FORMAT((SELECT start_datetime FROM Appointments WHERE appointment_id = p_appointment_id), '%Y-%m-%d %H:%i')));
    END IF;
    
    COMMIT;
END//

-- Procedimiento para obtener citas con filtros avanzados
CREATE PROCEDURE sp_GetAppointmentsFiltered(
    IN p_doctor_id INT,
    IN p_patient_id INT,
    IN p_specialty_id INT,
    IN p_status VARCHAR(20),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_year INT,
    IN p_month INT
)
BEGIN
    SELECT * FROM vw_AppointmentsComplete
    WHERE 1=1
    AND (p_doctor_id IS NULL OR doctor_id = p_doctor_id)
    AND (p_patient_id IS NULL OR patient_id = p_patient_id)
    AND (p_status IS NULL OR status = p_status)
    AND (p_start_date IS NULL OR DATE(start_datetime) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(start_datetime) <= p_end_date)
    AND (p_year IS NULL OR YEAR(start_datetime) = p_year)
    AND (p_month IS NULL OR MONTH(start_datetime) = p_month)
    AND (p_specialty_id IS NULL OR FIND_IN_SET(p_specialty_id, specialty_ids) > 0)
    ORDER BY start_datetime DESC;
END//

-- Procedimiento para obtener pacientes de un médico
CREATE PROCEDURE sp_GetDoctorPatients(
    IN p_doctor_id INT
)
BEGIN
    SELECT DISTINCT
        p.patient_id,
        p.first_name,
        p.last_name,
        p.birthdate,
        p.phone,
        p.address,
        COUNT(DISTINCT a.appointment_id) AS total_appointments,
        MAX(a.start_datetime) AS last_appointment_date,
        MIN(a.start_datetime) AS first_appointment_date
    FROM Patients p
    JOIN Appointments a ON p.patient_id = a.patient_id
    WHERE a.doctor_id = p_doctor_id
    GROUP BY p.patient_id, p.first_name, p.last_name, p.birthdate, p.phone, p.address
    ORDER BY p.last_name, p.first_name;
END//

-- Función para contar notificaciones no leídas
CREATE FUNCTION fn_GetUnreadNotificationsCount(p_user_id INT)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_count
    FROM Notifications
    WHERE user_id = p_user_id AND is_read = 0;
    
    RETURN v_count;
END//

-- Función para calcular edad del paciente
CREATE FUNCTION fn_CalculateAge(p_birthdate DATE)
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(YEAR, p_birthdate, CURDATE());
END//

DELIMITER ;

-- 3. Triggers para automatización
DELIMITER //

-- Trigger: Crear notificación cuando se crea una cita
CREATE TRIGGER trg_AppointmentCreated
AFTER INSERT ON Appointments
FOR EACH ROW
BEGIN
    -- Notificación se maneja en el procedimiento almacenado
    -- Este trigger puede usarse para validaciones adicionales
    IF NEW.start_datetime < NOW() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se pueden crear citas en el pasado';
    END IF;
END//

-- Trigger: Actualizar historial cuando cambia el estado
CREATE TRIGGER trg_AppointmentStatusChanged
BEFORE UPDATE ON Appointments
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO AppointmentHistory(
            appointment_id, 
            event_type, 
            old_value, 
            new_value,
            event_by_user_id
        )
        VALUES(
            NEW.appointment_id,
            'status_change',
            CONCAT('status=', OLD.status),
            CONCAT('status=', NEW.status),
            NEW.created_by_user_id
        );
    END IF;
END//

-- Trigger: Crear notificación al cancelar cita
CREATE TRIGGER trg_AppointmentCancelled
AFTER UPDATE ON Appointments
FOR EACH ROW
BEGIN
    DECLARE v_patient_user_id INT;
    DECLARE v_doctor_user_id INT;
    
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
        -- Obtener user_id del paciente
        SELECT user_id INTO v_patient_user_id
        FROM Patients
        WHERE patient_id = NEW.patient_id;
        
        -- Obtener user_id del doctor
        SELECT user_id INTO v_doctor_user_id
        FROM Doctors
        WHERE doctor_id = NEW.doctor_id;
        
        -- Crear notificaciones
        INSERT INTO Notifications(user_id, appointment_id, title, message)
        VALUES
        (v_patient_user_id, NEW.appointment_id, 'Cita cancelada', 
         CONCAT('Su cita del ', DATE_FORMAT(NEW.start_datetime, '%Y-%m-%d %H:%i'), ' ha sido cancelada')),
        (v_doctor_user_id, NEW.appointment_id, 'Cita cancelada', 
         CONCAT('La cita del ', DATE_FORMAT(NEW.start_datetime, '%Y-%m-%d %H:%i'), ' ha sido cancelada'));
    END IF;
END//

-- Trigger: Validar solapamiento antes de insertar
CREATE TRIGGER trg_ValidateAppointmentBeforeInsert
BEFORE INSERT ON Appointments
FOR EACH ROW
BEGIN
    IF fn_HasOverlap(NEW.doctor_id, NEW.start_datetime, NEW.end_datetime, NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El médico tiene otra cita en ese horario (solapamiento).';
    END IF;
    
    IF NEW.start_datetime >= NEW.end_datetime THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de inicio debe ser anterior a la fecha de fin.';
    END IF;
END//

-- Trigger: Validar solapamiento antes de actualizar
CREATE TRIGGER trg_ValidateAppointmentBeforeUpdate
BEFORE UPDATE ON Appointments
FOR EACH ROW
BEGIN
    IF (OLD.start_datetime != NEW.start_datetime OR OLD.end_datetime != NEW.end_datetime OR OLD.doctor_id != NEW.doctor_id) THEN
        IF fn_HasOverlap(NEW.doctor_id, NEW.start_datetime, NEW.end_datetime, NEW.appointment_id) THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El médico tiene otra cita en ese horario (solapamiento).';
        END IF;
    END IF;
    
    IF NEW.start_datetime >= NEW.end_datetime THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La fecha de inicio debe ser anterior a la fecha de fin.';
    END IF;
END//

DELIMITER ;

-- 3. Crear índices para optimización de consultas
-- Los índices se crean después de todas las tablas para evitar errores
CREATE INDEX IX_Appointments_Doctor_Start ON Appointments(doctor_id, start_datetime);
CREATE INDEX IX_Appointments_Patient_Start ON Appointments(patient_id, start_datetime);
CREATE INDEX IX_Appointments_Status ON Appointments(status);
CREATE INDEX IX_Appointments_StartDate ON Appointments(start_datetime);
CREATE INDEX IX_Notifications_User_Read ON Notifications(user_id, is_read);
CREATE INDEX IX_Notifications_Created ON Notifications(created_at);
CREATE INDEX IX_AppointmentHistory_Appointment ON AppointmentHistory(appointment_id);
CREATE INDEX IX_DoctorSpecialties_Doctor ON DoctorSpecialties(doctor_id);
CREATE INDEX IX_DoctorSpecialties_Specialty ON DoctorSpecialties(specialty_id);
CREATE INDEX IX_Users_Email ON Users(email);
CREATE INDEX IX_Users_Role ON Users(role);

-- 4. Datos de ejemplo
-- Usuarios
INSERT IGNORE INTO Users (username, email, password_hash, role) VALUES
('admin1', 'admin@clinic.test', '$2a$12$MZz992YOwQICBRuavc6IiOkIFO7J/YiTE.Ut0fyglfpiTyItqJt7W', 'admin'),
('drgarcia', 'dr.garcia@clinic.test', '$2a$12$MZz992YOwQICBRuavc6IiOkIFO7J/YiTE.Ut0fyglfpiTyItqJt7W', 'doctor'),
('drmartinez', 'dr.martinez@clinic.test', '$2a$12$MZz992YOwQICBRuavc6IiOkIFO7J/YiTE.Ut0fyglfpiTyItqJt7W', 'doctor'),
('paciente1', 'juan.p@clinic.test', '$2a$12$MZz992YOwQICBRuavc6IiOkIFO7J/YiTE.Ut0fyglfpiTyItqJt7W', 'patient'),
('paciente2', 'ana.p@clinic.test', '$2a$12$MZz992YOwQICBRuavc6IiOkIFO7J/YiTE.Ut0fyglfpiTyItqJt7W', 'patient');

-- Pacientes
INSERT IGNORE INTO Patients (user_id, first_name, last_name, birthdate, phone) VALUES
((SELECT user_id FROM Users WHERE username='paciente1'), 'Juan', 'Perez', '1985-06-12', '+573001112233'),
((SELECT user_id FROM Users WHERE username='paciente2'), 'Ana', 'Lopez', '1990-02-05', '+573002223344');

-- Doctores
INSERT IGNORE INTO Doctors (user_id, first_name, last_name, doc_license, phone) VALUES
((SELECT user_id FROM Users WHERE username='drgarcia'), 'Luis', 'García', 'MED12345', '+573003334455'),
((SELECT user_id FROM Users WHERE username='drmartinez'), 'María', 'Martínez', 'MED54321', '+573003334466');

-- Especialidades
INSERT IGNORE INTO Specialties (name, description) VALUES
('Cardiología', 'Cardiología general'),
('Pediatría', 'Pediatría general'),
('Medicina General', 'Atención general');

-- Asignar especialidades
INSERT IGNORE INTO DoctorSpecialties (doctor_id, specialty_id) VALUES
((SELECT doctor_id FROM Doctors WHERE last_name='García'), (SELECT specialty_id FROM Specialties WHERE name='Cardiología')),
((SELECT doctor_id FROM Doctors WHERE last_name='Martínez'), (SELECT specialty_id FROM Specialties WHERE name='Medicina General'));

-- Horarios
INSERT IGNORE INTO DoctorSchedules (doctor_id, weekday, start_time, end_time, slot_duration_min) VALUES
((SELECT doctor_id FROM Doctors WHERE last_name='García'), 1, '08:00:00', '12:00:00', 30),
((SELECT doctor_id FROM Doctors WHERE last_name='García'), 3, '14:00:00', '18:00:00', 30),
((SELECT doctor_id FROM Doctors WHERE last_name='Martínez'), 2, '09:00:00', '13:00:00', 20);

-- Cita de ejemplo
INSERT IGNORE INTO Appointments (patient_id, doctor_id, start_datetime, end_datetime, reason, created_by_user_id, channel) 
VALUES (
    (SELECT patient_id FROM Patients WHERE first_name='Juan'),
    (SELECT doctor_id FROM Doctors WHERE last_name='García'),
    '2025-12-05 08:30:00',
    '2025-12-05 09:00:00',
    'Consulta cardiología - control',
    (SELECT user_id FROM Users WHERE username='paciente1'),
    'presencial'
);