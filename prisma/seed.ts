import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CONTRASENA_SEED = 'Clave123!';

const habilidades = [
  { nombre_habilidad: 'JavaScript', categoria: 'Frontend' },
  { nombre_habilidad: 'TypeScript', categoria: 'Frontend' },
  { nombre_habilidad: 'React', categoria: 'Frontend' },
  { nombre_habilidad: 'Node.js', categoria: 'Backend' },
  { nombre_habilidad: 'Express', categoria: 'Backend' },
  { nombre_habilidad: 'Python', categoria: 'Backend' },
  { nombre_habilidad: 'SQL', categoria: 'Datos' },
  { nombre_habilidad: 'Diseño UX', categoria: 'Diseño' },
  { nombre_habilidad: 'Figma', categoria: 'Diseño' },
  { nombre_habilidad: 'Accesibilidad Web', categoria: 'Accesibilidad' },
  { nombre_habilidad: 'Comunicación asertiva', categoria: 'Habilidades blandas' },
  { nombre_habilidad: 'Trabajo en equipo', categoria: 'Habilidades blandas' },
  { nombre_habilidad: 'Gestión del tiempo', categoria: 'Habilidades blandas' },
  { nombre_habilidad: 'Atención al cliente', categoria: 'Servicio' },
  { nombre_habilidad: 'Redacción técnica', categoria: 'Comunicación' },
];

const tiposAjuste = [
  { nombre_ajuste: 'Teclado adaptado', descripcion: 'Teclado ergonómico o con teclas de mayor tamaño.' },
  { nombre_ajuste: 'Lector de pantalla', descripcion: 'Software que lee en voz alta el contenido de la pantalla.' },
  { nombre_ajuste: 'Intérprete de lengua de señas', descripcion: 'Interpretación disponible en reuniones y entrevistas.' },
  { nombre_ajuste: 'Horario flexible', descripcion: 'Ajuste de horario para citas médicas o terapias.' },
  { nombre_ajuste: 'Software de dictado por voz', descripcion: 'Herramientas de reconocimiento de voz para redactar.' },
  { nombre_ajuste: 'Silla ergonómica ajustable', descripcion: 'Asiento regulable en altura y postura.' },
  { nombre_ajuste: 'Reuniones con subtitulado', descripcion: 'Subtítulos en tiempo real para videollamadas.' },
  { nombre_ajuste: 'Espacio de trabajo accesible', descripcion: 'Puestos y recorridos adaptados dentro de la oficina.' },
];

const empresas = [
  {
    correo: 'rrhh@tecnova.com',
    nombre_empresa: 'Tecnova',
    descripcion: 'Empresa de desarrollo de software que impulsa equipos diversos.',
    sitio_web: 'https://tecnova.example.com',
    ubicacion: 'Ciudad de México',
  },
  {
    correo: 'talento@grupoincluso.com',
    nombre_empresa: 'Grupo Incluso',
    descripcion: 'Consultoría en inclusión laboral y accesibilidad.',
    sitio_web: 'https://grupoincluso.example.com',
    ubicacion: 'Guadalajara',
  },
  {
    correo: 'contacto@digitalia.com',
    nombre_empresa: 'Digitalia',
    descripcion: 'Agencia digital con foco en productos accesibles.',
    sitio_web: 'https://digitalia.example.com',
    ubicacion: 'Monterrey',
  },
];

const candidatos = [
  { correo: 'candidato1@enlaza.com', nombre_completo: 'Ana Martínez', ubicacion: 'Ciudad de México', telefono: '5550000001' },
  { correo: 'candidato2@enlaza.com', nombre_completo: 'Luis García', ubicacion: 'Guadalajara', telefono: '5550000002' },
  { correo: 'candidato3@enlaza.com', nombre_completo: 'María López', ubicacion: 'Monterrey', telefono: '5550000003' },
  { correo: 'candidato4@enlaza.com', nombre_completo: 'Carlos Ruiz', ubicacion: 'Puebla', telefono: '5550000004' },
  { correo: 'candidato5@enlaza.com', nombre_completo: 'Sofía Torres', ubicacion: 'Querétaro', telefono: '5550000005' },
];

const vacantes = [
  {
    correoEmpresa: 'rrhh@tecnova.com',
    titulo: 'Desarrollador/a Full Stack',
    descripcion:
      'Nos sumamos un desarrollador/a full stack para construir módulos del producto accesibles e inclusivos, trabajando con Node.js, TypeScript y React.',
    modalidad: 'presencial' as const,
    ubicacion: 'Ciudad de México',
    salario_min: 25000,
    salario_max: 40000,
    fecha_cierre: null,
    estado: 'activa' as const,
    ajustes: ['Teclado adaptado', 'Horario flexible', 'Silla ergonómica ajustable'],
  },
  {
    correoEmpresa: 'talento@grupoincluso.com',
    titulo: 'Consultor/a en Accesibilidad Digital',
    descripcion:
      'Auditoría y acompañamiento a equipos para que sus productos digitales cumplan las mejores prácticas de accesibilidad web.',
    modalidad: 'hibrido' as const,
    ubicacion: 'Guadalajara',
    salario_min: 18000,
    salario_max: 30000,
    fecha_cierre: null,
    estado: 'activa' as const,
    ajustes: ['Software de dictado por voz', 'Reuniones con subtitulado', 'Horario flexible'],
  },
  {
    correoEmpresa: 'contacto@digitalia.com',
    titulo: 'Diseñador/a UX con enfoque accesible',
    descripcion:
      'Diseño de interfaces accesibles: investigación con personas usuarias, prototipos en Figma y pruebas con lectores de pantalla.',
    modalidad: 'remoto' as const,
    ubicacion: 'Remoto',
    salario_min: 20000,
    salario_max: 35000,
    fecha_cierre: null,
    estado: 'activa' as const,
    ajustes: ['Horario flexible', 'Espacio de trabajo accesible', 'Reuniones con subtitulado'],
  },
  {
    correoEmpresa: 'rrhh@tecnova.com',
    titulo: 'Soporte Técnico Remoto',
    descripcion:
      'Atención de incidentes de primer nivel para clientes, todo de manera remota con herramientas colaborativas.',
    modalidad: 'remoto' as const,
    ubicacion: 'Remoto',
    salario_min: 12000,
    salario_max: 18000,
    fecha_cierre: new Date('2026-08-01'),
    estado: 'cerrada' as const,
    ajustes: ['Horario flexible'],
  },
  {
    correoEmpresa: 'contacto@digitalia.com',
    titulo: 'Redactor/a Técnico',
    descripcion:
      'Redacción de documentación técnica clara e inclusiva para manuales de producto y guías de accesibilidad.',
    modalidad: 'hibrido' as const,
    ubicacion: 'Monterrey',
    salario_min: 15000,
    salario_max: 22000,
    fecha_cierre: null,
    estado: 'activa' as const,
    ajustes: ['Software de dictado por voz', 'Silla ergonómica ajustable'],
  },
];

const habilidadesCandidato = [
  { nombre: 'JavaScript', nivel: 'intermedio' },
  { nombre: 'TypeScript', nivel: 'intermedio' },
  { nombre: 'React', nivel: 'basico' },
  { nombre: 'Accesibilidad Web', nivel: 'avanzado' },
];

const ajustesCandidato = ['Horario flexible', 'Silla ergonómica ajustable'];

async function main(): Promise<void> {
  const hash = await bcrypt.hash(CONTRASENA_SEED, 10);

  await prisma.habilidad.deleteMany();
  await prisma.habilidad.createMany({ data: habilidades });

  await prisma.tipoAjuste.deleteMany();
  await prisma.tipoAjuste.createMany({ data: tiposAjuste });

  await prisma.usuario.upsert({
    where: { correo: 'admin@enlaza.com' },
    update: {},
    create: { correo: 'admin@enlaza.com', contrasena_hash: hash, tipo_usuario: 'admin' },
  });

  for (const empresa of empresas) {
    await prisma.usuario.upsert({
      where: { correo: empresa.correo },
      update: {},
      create: {
        correo: empresa.correo,
        contrasena_hash: hash,
        tipo_usuario: 'empresa',
        empresa: {
          create: {
            nombre_empresa: empresa.nombre_empresa,
            descripcion: empresa.descripcion,
            sitio_web: empresa.sitio_web,
            ubicacion: empresa.ubicacion,
          },
        },
      },
    });
  }

  for (const candidato of candidatos) {
    await prisma.usuario.upsert({
      where: { correo: candidato.correo },
      update: {},
      create: {
        correo: candidato.correo,
        contrasena_hash: hash,
        tipo_usuario: 'candidato',
        candidato: {
          create: {
            nombre_completo: candidato.nombre_completo,
            ubicacion: candidato.ubicacion,
            telefono: candidato.telefono,
          },
        },
      },
    });
  }

  const ajustesPorNombre = new Map((await prisma.tipoAjuste.findMany()).map((aj) => [aj.nombre_ajuste, aj.id_ajuste]));
  const habilidadesPorNombre = new Map((await prisma.habilidad.findMany()).map((hab) => [hab.nombre_habilidad, hab.id_habilidad]));

  await prisma.vacante.deleteMany();
  for (const vacante of vacantes) {
    const empresaUsuario = await prisma.usuario.findUnique({
      where: { correo: vacante.correoEmpresa },
      include: { empresa: true },
    });
    if (!empresaUsuario?.empresa) {
      continue;
    }
    await prisma.vacante.create({
      data: {
        id_empresa: empresaUsuario.empresa.id_empresa,
        titulo: vacante.titulo,
        descripcion: vacante.descripcion,
        modalidad: vacante.modalidad,
        ubicacion: vacante.ubicacion,
        salario_min: vacante.salario_min,
        salario_max: vacante.salario_max,
        fecha_cierre: vacante.fecha_cierre,
        estado: vacante.estado,
        ajustes: {
          create: vacante.ajustes.map((nombreAjuste) => ({ id_ajuste: ajustesPorNombre.get(nombreAjuste)! })),
        },
      },
    });
  }

  await prisma.habilidadCandidato.deleteMany();
  await prisma.ajusteCandidato.deleteMany();
  const ana = await prisma.usuario.findUnique({ where: { correo: 'candidato1@enlaza.com' }, include: { candidato: true } });
  if (ana?.candidato) {
    await prisma.habilidadCandidato.createMany({
      data: habilidadesCandidato.map((hab) => ({
        id_candidato: ana.candidato!.id_candidato,
        id_habilidad: habilidadesPorNombre.get(hab.nombre)!,
        nivel: hab.nivel as 'basico' | 'intermedio' | 'avanzado',
      })),
    });
    await prisma.ajusteCandidato.createMany({
      data: ajustesCandidato.map((nombreAjuste) => ({
        id_candidato: ana.candidato!.id_candidato,
        id_ajuste: ajustesPorNombre.get(nombreAjuste)!,
      })),
    });
  }

  console.log('Seed completado. Usuarios:', [...empresas.map((e) => e.correo), ...candidatos.map((c) => c.correo), 'admin@enlaza.com'].join(', '));
  console.log(`Contraseña de prueba para todos los usuarios: ${CONTRASENA_SEED}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });