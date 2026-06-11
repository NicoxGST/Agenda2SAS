import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type MessageAuthor = "bot" | "user";

type ChatIntent =
  | "HOURS"
  | "LOCATION"
  | "SERVICES"
  | "PRICES"
  | "BOOKING"
  | "TRACKING"
  | "SUPPORT"
  | "ACCOUNT"
  | "PC_BUILD"
  | "CONSOLE"
  | "POWER_ISSUE"
  | "POWER_LIGHT_YES"
  | "POWER_LIGHT_NO"
  | "SCREEN_ISSUE"
  | "SLOW_DEVICE"
  | "OVERHEATING"
  | "CHARGING_ISSUE"
  | "INTERNET_ISSUE"
  | "NOISE_ISSUE"
  | "VIRUS_ISSUE"
  | "KEYBOARD_ISSUE"
  | "FALLBACK";

type ChatAction = {
  label: string;
  to: string;
  external?: boolean;
};

type ChatOption = {
  label: string;
  query: string;
};

type Message = {
  id: number;
  from: MessageAuthor;
  text: string;
  actions?: ChatAction[];
  options?: ChatOption[];
  typing?: boolean;
};

type KnowledgeItem = {
  intent: ChatIntent;
  keywords: string[];
  reply: Omit<Message, "id" | "from">;
};

const initialMessages: Message[] = [
  {
    id: 1,
    from: "bot",
    text: "Hola, soy el asistente de LinaresTech. Puedo ayudarte con dudas sobre nuestros servicios o guiarte si tu equipo presenta una falla.",
  },
];

const quickQuestions: ChatOption[] = [
  { label: "Horarios",     query: "Cuales son los horarios de atencion?" },
  { label: "Ubicación",    query: "Donde estan ubicados?" },
  { label: "Armado PC",    query: "Hacen armado de computadores?" },
  { label: "Consolas",     query: "Reparan consolas?" },
  { label: "Agendar",      query: "Como puedo agendar una revision?" },
  { label: "No prende",    query: "Mi equipo no prende" },
  { label: "Pantalla negra", query: "Mi pantalla esta negra" },
  { label: "Equipo lento", query: "Mi equipo esta lento" },
  { label: "Soporte",      query: "Necesito contactar soporte" },
];

const knowledgeBase: KnowledgeItem[] = [
  {
    intent: "HOURS",
    keywords: ["horario", "horarios", "atienden", "abren", "cierran", "atencion"],
    reply: {
      text: "Atendemos de lunes a sábado de 10:00 a 17:30. Los domingos permanecemos cerrados.",
    },
  },
  {
    intent: "LOCATION",
    keywords: ["ubicacion", "direccion", "donde estan", "como llego", "donde quedan", "local", "taller"],
    reply: {
      text: "Estamos en El Amanecer #1657, Villa Nemesio Antunez, Linares, Maule. Puedes vernos en el mapa en nuestra página de inicio.",
      actions: [
        { label: "Ver en el mapa", to: "https://maps.google.com/maps?q=El+Amanecer+1657,+Linares,+Maule,+Chile", external: true },
        { label: "WhatsApp", to: "https://wa.me/56985833034", external: true },
      ],
    },
  },
  {
    intent: "PC_BUILD",
    keywords: ["armado", "armar", "computador", "pc", "gaming", "componentes", "rgb", "gabinete"],
    reply: {
      text: "Sí, hacemos armado de computadores a medida. Puedes traer tus componentes o cotizar con nosotros. Nos especializamos en equipos gaming con refrigeración y RGB.",
      actions: [
        { label: "Agendar cotización", to: "/client" },
        { label: "WhatsApp", to: "https://wa.me/56985833034", external: true },
      ],
    },
  },
  {
    intent: "CONSOLE",
    keywords: ["consola", "consolas", "playstation", "xbox", "nintendo", "ps4", "ps5", "switch"],
    reply: {
      text: "Realizamos mantención y reparación de consolas: PlayStation, Xbox, Nintendo Switch y más. Si tu consola presenta fallas, tráela para diagnóstico.",
      actions: [
        { label: "Agendar revisión", to: "/client" },
        { label: "WhatsApp", to: "https://wa.me/56985833034", external: true },
      ],
    },
  },
  {
    intent: "SERVICES",
    keywords: ["servicio", "servicios", "reparacion", "mantencion", "diagnostico", "que hacen", "que ofrecen"],
    reply: {
      text: "Ofrecemos: reparación de notebooks y PC, mantención de consolas, armado de computadores, limpieza y actualización de equipos. Más de 300 trabajos exitosos.",
      actions: [
        { label: "Ver servicios", to: "/servicios" },
      ],
    },
  },
  {
    intent: "PRICES",
    keywords: ["precio", "valor", "costo", "cuanto", "cobran", "tarifa"],
    reply: {
      text: "El valor depende de la falla y el servicio requerido. Para un precio exacto primero se debe revisar el equipo. Consulta sin compromiso por WhatsApp.",
      actions: [
        { label: "WhatsApp", to: "https://wa.me/56985833034", external: true },
        { label: "Agendar revisión", to: "/client" },
      ],
    },
  },
  {
    intent: "BOOKING",
    keywords: ["agendar", "agenda", "reserva", "reservar", "cita", "revision", "quiero llevar"],
    reply: {
      text: "Para agendar una revisión inicia sesión o crea una cuenta. También puedes escribirnos directo por WhatsApp.",
      actions: [
        { label: "Login", to: "/login" },
        { label: "Registro", to: "/register" },
        { label: "WhatsApp", to: "https://wa.me/56985833034", external: true },
      ],
    },
  },
  {
    intent: "TRACKING",
    keywords: ["estado de mi equipo", "seguimiento", "avance", "esta listo", "está listo", "cuando estara"],
    reply: {
      text: "El estado de tu equipo lo puedes revisar desde tu panel de cliente una vez que esté registrado en el sistema.",
      actions: [
        { label: "Mi panel", to: "/client" },
      ],
    },
  },
  {
    intent: "SUPPORT",
    keywords: ["contacto", "soporte", "ayuda personalizada", "hablar con alguien", "hablar con soporte", "llamar"],
    reply: {
      text: "Puedes contactarnos directamente por WhatsApp o Instagram. Respondemos en horario de atención.",
      actions: [
        { label: "WhatsApp", to: "https://wa.me/56985833034", external: true },
        { label: "Instagram", to: "https://www.instagram.com/linares_tech", external: true },
      ],
    },
  },
  {
    intent: "ACCOUNT",
    keywords: ["login", "sesion", "registro", "registrar", "cuenta", "contrasena"],
    reply: {
      text: "Si ya tienes cuenta, inicia sesión. Si eres nuevo, puedes registrarte para acceder al panel de cliente.",
      actions: [
        { label: "Login", to: "/login" },
        { label: "Registro", to: "/register" },
      ],
    },
  },
  {
    intent: "POWER_ISSUE",
    keywords: ["no prende", "no enciende", "sin energia", "no parte", "apagado"],
    reply: {
      text: "Puede estar relacionado con energía, batería, cargador o placa. ¿El equipo muestra alguna luz al conectarlo?",
      options: [
        { label: "Sí muestra luz", query: "Si muestra luz al conectarlo" },
        { label: "No muestra luz", query: "No muestra luz al conectarlo" },
        { label: "Agendar revisión", query: "Quiero agendar una revision" },
      ],
    },
  },
  {
    intent: "POWER_LIGHT_YES",
    keywords: ["si muestra luz", "tiene luz", "enciende luz", "luz al conectarlo"],
    reply: {
      text: "Si muestra luz pero no enciende, puede haber un problema de pantalla, memoria, disco o sistema. Se recomienda revisión técnica para diagnosticarlo.",
      actions: [{ label: "Agendar revisión", to: "/client" }],
    },
  },
  {
    intent: "POWER_LIGHT_NO",
    keywords: ["no muestra luz", "sin luz", "ninguna luz", "no tiene luz"],
    reply: {
      text: "Sin ninguna luz puede ser cargador, batería, conector o placa de energía. Evita seguir intentando si hay olor a quemado o calentamiento.",
      actions: [
        { label: "Agendar revisión", to: "/client" },
        { label: "WhatsApp", to: "https://wa.me/56985833034", external: true },
      ],
    },
  },
  {
    intent: "SCREEN_ISSUE",
    keywords: ["pantalla negra", "sin imagen", "no da imagen", "lineas", "parpadea", "pantalla rota"],
    reply: {
      text: "Puede ser falla de pantalla, cable flex, tarjeta gráfica o configuración de video. Si el equipo enciende, prueba conectar una pantalla externa primero.",
      options: [
        { label: "Enciende pero sin imagen", query: "Mi equipo enciende pero no da imagen" },
        { label: "Agendar revisión", query: "Quiero agendar una revision" },
      ],
    },
  },
  {
    intent: "SLOW_DEVICE",
    keywords: ["lento", "se pega", "demora", "congelado", "trabado"],
    reply: {
      text: "La lentitud puede deberse a poco espacio, programas en segundo plano, virus, disco dañado o falta de mantención. Respalda tus archivos y solicita una revisión.",
      actions: [{ label: "Agendar revisión", to: "/client" }],
    },
  },
  {
    intent: "OVERHEATING",
    keywords: ["calienta", "temperatura", "sobrecalienta", "ventilador", "muy caliente"],
    reply: {
      text: "El sobrecalentamiento suele relacionarse con polvo, pasta térmica seca o ventilación obstruida. Evita usar el equipo sobre telas y considera una mantención preventiva.",
      actions: [{ label: "Agendar mantención", to: "/client" }],
    },
  },
  {
    intent: "CHARGING_ISSUE",
    keywords: ["no carga", "cargador", "bateria", "enchufe", "conector"],
    reply: {
      text: "Prueba otro enchufe y revisa si el cargador o conector están sueltos o dañados. Si el problema persiste, requiere revisión técnica.",
      actions: [{ label: "Agendar revisión", to: "/client" }],
    },
  },
  {
    intent: "INTERNET_ISSUE",
    keywords: ["internet", "wifi", "wi fi", "conexion", "red"],
    reply: {
      text: "Reinicia el router, verifica si otros equipos tienen conexión y revisa que el WiFi esté activado. Si solo falla este equipo, puede ser controlador o configuración.",
    },
  },
  {
    intent: "NOISE_ISSUE",
    keywords: ["ruido", "suena", "zumbido", "ventilador fuerte", "traqueteo"],
    reply: {
      text: "Un ruido extraño puede venir del ventilador, disco mecánico o piezas sueltas. Si el sonido es fuerte o aparece de repente, evita usar el equipo por mucho tiempo.",
      actions: [{ label: "Agendar revisión", to: "/client" }],
    },
  },
  {
    intent: "VIRUS_ISSUE",
    keywords: ["virus", "publicidad", "ventanas", "malware", "infectado"],
    reply: {
      text: "Si aparecen ventanas extrañas, publicidad o programas desconocidos, podría ser malware. Evita ingresar contraseñas hasta revisar el equipo.",
      actions: [{ label: "Agendar revisión", to: "/client" }],
    },
  },
  {
    intent: "KEYBOARD_ISSUE",
    keywords: ["teclado", "mouse", "touchpad", "no escribe", "teclas"],
    reply: {
      text: "Prueba reiniciar y conectar un periférico externo. Revisa si hubo derrame de líquido. Si persiste, requiere revisión técnica.",
      actions: [{ label: "Agendar revisión", to: "/client" }],
    },
  },
];

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function findKnowledgeItem(query: string) {
  const text = normalizeText(query);
  let bestMatch: { item: KnowledgeItem; score: number } | null = null;

  for (const item of knowledgeBase) {
    const score = item.keywords.reduce((total, keyword) => {
      const nk = normalizeText(keyword);
      return text.includes(nk) ? total + nk.length : total;
    }, 0);

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { item, score };
    }
  }

  return bestMatch?.item;
}

function buildFallbackReply(id: number): Message {
  return {
    id,
    from: "bot",
    text: "No tengo una respuesta exacta para esa consulta. Puedes escribirnos por WhatsApp para ayuda personalizada.",
    actions: [
      { label: "WhatsApp", to: "https://wa.me/56985833034", external: true },
      { label: "Login", to: "/login" },
    ],
  };
}

function buildBotReply(query: string, id: number): Message {
  const item = findKnowledgeItem(query);
  if (!item) return buildFallbackReply(id);
  return { id, from: "bot", text: item.reply.text, actions: item.reply.actions, options: item.reply.options };
}

function IconChat() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function ClientChatBot() {
  const messageIdRef = useRef(2);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function getNextMessageId() {
    return messageIdRef.current++;
  }

  function sendMessage(query: string) {
    const text = query.trim();
    if (!text) return;

    const userMsg: Message = { id: getNextMessageId(), from: "user", text };
    const typingId = getNextMessageId();
    const typingMsg: Message = { id: typingId, from: "bot", text: "", typing: true };

    setMessages((prev) => [...prev, userMsg, typingMsg]);
    setInput("");

    setTimeout(() => {
      const botMsg = buildBotReply(text, typingId);
      setMessages((prev) => prev.map((m) => (m.id === typingId ? botMsg : m)));
    }, 750);
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setMessages(initialMessages);
      messageIdRef.current = 2;
    }, 300);
  }

  return (
    <div className="chatbot">
      {open && (
        <section className="chatbot-window">
          <header className="chatbot-header">
            <div className="chatbot-header-brand">
              <img src="/logo.jpeg" alt="LinaresTech" className="chatbot-header-logo" />
              <div>
                <strong>Asistente LinaresTech</strong>
                <p>Respuestas al instante</p>
              </div>
            </div>
            <button type="button" className="chatbot-close-btn" onClick={handleClose} aria-label="Cerrar chat">
              <IconClose />
            </button>
          </header>

          <div className="chatbot-quick">
            {quickQuestions.map((q) => (
              <button key={q.label} type="button" onClick={() => sendMessage(q.query)}>
                {q.label}
              </button>
            ))}
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chatbot-message chatbot-message-${message.from}`}>
                {message.typing ? (
                  <div className="chatbot-typing-dots">
                    <span /><span /><span />
                  </div>
                ) : (
                  <>
                    <p>{message.text}</p>
                    {message.options && (
                      <div className="chatbot-actions">
                        {message.options.map((opt) => (
                          <button key={opt.label} type="button" onClick={() => sendMessage(opt.query)}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {message.actions && (
                      <div className="chatbot-actions">
                        {message.actions.map((action) =>
                          action.external ? (
                            <a key={action.label} href={action.to} target="_blank" rel="noopener noreferrer">
                              {action.label}
                            </a>
                          ) : (
                            <Link key={action.label} to={action.to}>
                              {action.label}
                            </Link>
                          )
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-form">
            <input
              placeholder="Escribe tu consulta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }}
            />
            <button type="button" onClick={() => sendMessage(input)}>Enviar</button>
          </div>
        </section>
      )}

      <button
        className={`chatbot-toggle ${open ? "is-open" : ""}`}
        type="button"
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        onClick={() => (open ? handleClose() : setOpen(true))}
      >
        <IconChat />
      </button>
    </div>
  );
}
