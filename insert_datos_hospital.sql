-- =============================================================================
-- INSERCIÓN MANUAL DE DATOS PARA EL SISTEMA HOSPITALARIO (BASE DE DATOS: MESSI)
-- =============================================================================

BEGIN;

-- 1. HOSPITALES ADICIONALES (IDs 11 a 15)
INSERT INTO "Hospital" ("IDHospital", "NombreH", "DireccionH", "SitioWeb", "EstadoH")
VALUES 
    (11, 'Hospital Universitario CEMIC', 'Av. Las Heras 2900, Recoleta, CABA', 'https://www.cemic.edu.ar', 'Activo'),
    (12, 'Sanatorio Mater Dei', 'San Martín de Tours 2952, Palermo, CABA', 'https://www.sanatoriomaterdei.com.ar', 'Activo'),
    (13, 'Hospital General de Niños Pedro de Elizalde', 'Av. Manuel Montes de Oca 40, Barracas, CABA', 'https://buenosaires.gob.ar/hospitalelizalde', 'Activo'),
    (14, 'Sanatorio Otamendi', 'Azcuénaga 870, Balvanera, CABA', 'https://www.otamendi.com.ar', 'Activo'),
    (15, 'Hospital de Pediatría Garrahan', 'Combate de los Pozos 1881, Parque Patricios, CABA', 'https://www.garrahan.gov.ar', 'Activo')
ON CONFLICT ("IDHospital") DO NOTHING;

-- Ajustar la secuencia de Hospital si existe
SELECT setval(pg_get_serial_sequence('"Hospital"', 'IDHospital'), COALESCE((SELECT MAX("IDHospital") FROM "Hospital"), 1));


-- 2. MÉDICOS ADICIONALES (IDs / DNI de 20000001 a 20000010)
INSERT INTO "Medico" ("IDMedico", "NomApeM", "NombM", "EspecialidadM", "EdadM", "EstadoM", "IDHospital")
VALUES
    (20000001, 'Martínez, Sofía', 'Sofía', 'Cardiología', 42, 'Activo', 1),
    (20000002, 'Rodríguez, Pablo', 'Pablo', 'Pediatría', 38, 'Activo', 13),
    (20000003, 'Fernández, Lucía', 'Lucía', 'Traumatología', 45, 'Activo', 2),
    (20000004, 'González, Esteban', 'Esteban', 'Neurología', 50, 'Activo', 3),
    (20000005, 'López, Valentina', 'Valentina', 'Dermatología', 36, 'Activo', 4),
    (20000006, 'Díaz, Mariano', 'Mariano', 'Gastroenterología', 47, 'Activo', 5),
    (20000007, 'Pérez, Florencia', 'Florencia', 'Oftalmología', 39, 'Activo', 11),
    (20000008, 'Castro, Hernán', 'Hernán', 'Neumonología', 53, 'Activo', 12),
    (20000009, 'Romero, Mariana', 'Mariana', 'Ginecología', 41, 'Activo', 14),
    (20000010, 'Alvarez, Martín', 'Martín', 'Pediatría', 44, 'Activo', 15)
ON CONFLICT ("IDMedico") DO NOTHING;


-- 3. ASIGNACIÓN DE ROLES A LOS MÉDICOS (Rol 2 = Médico)
INSERT INTO "MedicoRol" ("IDMedico", "IDRol", "createdAt", "updatedAt")
VALUES
    (20000001, 2, NOW(), NOW()),
    (20000002, 2, NOW(), NOW()),
    (20000003, 2, NOW(), NOW()),
    (20000004, 2, NOW(), NOW()),
    (20000005, 2, NOW(), NOW()),
    (20000006, 2, NOW(), NOW()),
    (20000007, 2, NOW(), NOW()),
    (20000008, 2, NOW(), NOW()),
    (20000009, 2, NOW(), NOW()),
    (20000010, 2, NOW(), NOW())
ON CONFLICT DO NOTHING;


-- 4. USUARIOS / PACIENTES ADICIONALES (DNIs 31000001 a 31000010)
INSERT INTO "Usuario" ("DNIUsuario", "NomApeU", "EstadoU", "EdadU", "Email", "Password", "IDPlanes")
VALUES
    (31000001, 'Sosa, Andrea', 'Activo', 29, 'andrea.sosa@mail.com', '123456', 1),
    (31000002, 'Morales, Diego', 'Activo', 34, 'diego.morales@mail.com', '123456', 2),
    (31000003, 'Vázquez, Valeria', 'Activo', 41, 'valeria.vazquez@mail.com', '123456', 3),
    (31000004, 'Ríos, Gonzalo', 'Activo', 25, 'gonzalo.rios@mail.com', '123456', 4),
    (31000005, 'Ortiz, Natalia', 'Activo', 37, 'natalia.ortiz@mail.com', '123456', 5),
    (31000006, 'Medina, Lucas', 'Activo', 48, 'lucas.medina@mail.com', '123456', 6),
    (31000007, 'Castillo, Daniela', 'Activo', 31, 'daniela.castillo@mail.com', '123456', 7),
    (31000008, 'Ruiz, Javier', 'Activo', 52, 'javier.ruiz@mail.com', '123456', 8),
    (31000009, 'Méndez, Camila', 'Activo', 22, 'camila.mendez@mail.com', '123456', 9),
    (31000010, 'Guzmán, Federico', 'Activo', 45, 'federico.guzman@mail.com', '123456', 10)
ON CONFLICT ("DNIUsuario") DO NOTHING;


-- 5. ASIGNACIÓN DE ROLES A LOS USUARIOS (Rol 3 = Paciente)
INSERT INTO "UsuarioRol" ("DNIUsuario", "IDRol", "createdAt", "updatedAt")
VALUES
    (31000001, 3, NOW(), NOW()),
    (31000002, 3, NOW(), NOW()),
    (31000003, 3, NOW(), NOW()),
    (31000004, 3, NOW(), NOW()),
    (31000005, 3, NOW(), NOW()),
    (31000006, 3, NOW(), NOW()),
    (31000007, 3, NOW(), NOW()),
    (31000008, 3, NOW(), NOW()),
    (31000009, 3, NOW(), NOW()),
    (31000010, 3, NOW(), NOW())
ON CONFLICT DO NOTHING;


-- 6. CITAS MÉDICAS ADICIONALES
INSERT INTO "Cita" ("FechaVisita", "Estado", "Calificada", "Calificacion", "Comentario", "IDHospital", "DNIUsuario", "DNIMedico")
VALUES
    ('2026-10-25 09:00:00-03', 'Reservado', false, NULL, NULL, 1, 31000001, 20000001),
    ('2026-10-25 10:30:00-03', 'Reservado', false, NULL, NULL, 13, 31000002, 20000002),
    ('2026-10-26 11:00:00-03', 'Reservado', false, NULL, NULL, 2, 31000003, 20000003),
    ('2026-10-26 14:00:00-03', 'Reservado', false, NULL, NULL, 3, 31000004, 20000004),
    ('2026-10-27 15:30:00-03', 'Reservado', false, NULL, NULL, 4, 31000005, 20000005),
    ('2026-10-15 08:30:00-03', 'Atendido', true, 5, 'Excelente atención de la Dra. Martínez en cardiología.', 1, 31000006, 20000001),
    ('2026-10-16 09:45:00-03', 'Atendido', true, 4, 'Muy puntual y amable en pediatría.', 13, 31000007, 20000002),
    ('2026-10-16 11:15:00-03', 'Atendido', true, 5, 'El Dr. Fernández explicó con detalle el diagnóstico.', 2, 31000008, 20000003),
    ('2026-10-17 10:00:00-03', 'Atendido', true, 3, 'Demora en la sala de espera pero buena consulta.', 3, 31000009, 20000004),
    ('2026-10-17 16:00:00-03', 'Atendido', true, 5, 'Dermatología de primer nivel.', 4, 31000010, 20000005),
    ('2026-10-18 12:00:00-03', 'Cancelado', false, NULL, 'El paciente reprogramó por motivos personales', 5, 31000001, 20000006),
    ('2026-10-28 09:15:00-03', 'Reservado', false, NULL, NULL, 11, 31000002, 20000007),
    ('2026-10-28 10:45:00-03', 'Reservado', false, NULL, NULL, 12, 31000003, 20000008),
    ('2026-10-29 13:30:00-03', 'Reservado', false, NULL, NULL, 14, 31000004, 20000009),
    ('2026-10-29 15:00:00-03', 'Reservado', false, NULL, NULL, 15, 31000005, 20000010);


-- 7. VALORACIONES DE HOSPITALES
INSERT INTO "Valoracion" ("Calificacion", "Comentario", "FechaValoracion", "IDHospital", "DNIUsuario")
VALUES
    (5, 'Instalaciones impecables y personal muy atento.', '2026-10-16 10:00:00-03', 1, 31000001),
    (4, 'Buena organización y rapidez en la asignación de turnos.', '2026-10-16 12:30:00-03', 2, 31000002),
    (5, 'Excelente hospital, equipamiento de última tecnología.', '2026-10-17 11:15:00-03', 3, 31000003),
    (4, 'Atención correcta y profesionales muy dedicados.', '2026-10-17 15:45:00-03', 4, 31000004),
    (5, 'El mejor centro para atención pediátrica especializada.', '2026-10-18 09:20:00-03', 13, 31000005),
    (5, 'Muy conforme con la guardia y los estudios complementarios.', '2026-10-18 14:10:00-03', 11, 31000006),
    (4, 'Cómodas instalaciones y excelente predisposición de enfermería.', '2026-10-19 10:50:00-03', 12, 31000007),
    (5, 'Atención médica y humana sobresaliente en el Garrahan.', '2026-10-19 16:30:00-03', 15, 31000008);

COMMIT;
