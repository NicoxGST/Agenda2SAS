import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

type MessageAuthor = "bot" | "user";

type ChatIntent =
  | "HOURS"
  | "SERVICES"
  | "PRICES"
  | "BOOKING"
  | "TRACKING"
  | "SUPPORT"
  | "ACCOUNT"
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
    text: "Hola, soy el asistente de Agenda2SAS. Puedo ayudarte con dudas generales y orientarte si tu equipo presenta una falla.",
  },
];

const quickQuestions: ChatOption[] = [
  {
    label: "Horarios",
    query: "Cuales son los horarios de atencion?",
  },
  {
    label: "Agendar",
    query: "Como puedo agendar una revision?",
  },
  {
    label: "No prende",
    query: "Mi equipo no prende",
  },
  {
    label: "Pantalla negra",
    query: "Mi pantalla esta negra",
  },
  {
    label: "Equipo lento",
    query: "Mi equipo esta lento",
  },
  {
    label: "No carga",
    query: "Mi equipo no carga",
  },
  {
    label: "Soporte",
    query: "Necesito contactar soporte",
  },
];

const knowledgeBase: KnowledgeItem[] = [
  {
    intent: "HOURS",
    keywords: ["horario", "horarios", "atienden", "abren", "cierran"],
    reply: {
      text: "Nuestro horario de atencion es de lunes a sabado, de 09:00 a 18:00.",
    },
  },
  {
    intent: "SERVICES",
    keywords: [
      "servicio",
      "servicios",
      "reparacion",
      "mantencion",
      "diagnostico",
    ],
    reply: {
      text: "Podemos orientarte segun la falla del equipo. Si necesitas un diagnostico exacto, lo recomendable es agendar una revision tecnica.",
      actions: [
        {
          label: "Ir a mi panel",
          to: "/client",
        },
      ],
    },
  },
  {
    intent: "PRICES",
    keywords: ["precio", "valor", "costo", "cuanto", "cobran"],
    reply: {
      text: "El valor depende del tipo de falla y del servicio necesario. Para entregar un precio mas preciso, primero se debe revisar el equipo.",
      actions: [
        {
          label: "Agendar revision",
          to: "/client",
        },
      ],
    },
  },
  {
    intent: "BOOKING",
    keywords: ["agendar", "agenda", "reserva", "reservar", "cita", "revision"],
    reply: {
      text: "Para agendar una revision debes iniciar sesion o crear una cuenta. Luego podras acceder a tu panel de cliente.",
      actions: [
        {
          label: "Login",
          to: "/login",
        },
        {
          label: "Registro",
          to: "/register",
        },
      ],
    },
  },
  {
    intent: "TRACKING",
    keywords: [
      "estado de mi equipo",
      "seguimiento",
      "avance",
      "esta listo",
      "está listo",
    ],
    reply: {
      text: "El seguimiento del equipo se revisara desde el panel del cliente cuando el equipo ya haya sido registrado en el sistema.",
      actions: [
        {
          label: "Ir a mi panel",
          to: "/client",
        },
      ],
    },
  },
  {
    intent: "SUPPORT",
    keywords: [
      "contacto",
      "soporte",
      "ayuda personalizada",
      "hablar con alguien",
      "hablar con soporte",
    ],
    reply: {
      text: "Si necesitas ayuda personalizada, te recomiendo contactar soporte o agendar una revision tecnica.",
      actions: [
        {
          label: "Agendar revision",
          to: "/client",
        },
      ],
    },
  },
  {
    intent: "ACCOUNT",
    keywords: ["login", "sesion", "registro", "registrar", "cuenta"],
    reply: {
      text: "Si ya tienes cuenta, inicia sesion. Si eres nuevo, puedes registrarte para acceder al panel de cliente.",
      actions: [
        {
          label: "Login",
          to: "/login",
        },
        {
          label: "Registro",
          to: "/register",
        },
      ],
    },
  },
  {
    intent: "POWER_ISSUE",
    keywords: ["no prende", "no enciende", "sin energia", "no parte", "apagado"],
    reply: {
      text: "Puede estar relacionado con energia, bateria, cargador o placa. Primero revisa si el equipo muestra alguna luz al conectarlo.",
      options: [
        {
          label: "Si muestra luz",
          query: "Si muestra luz al conectarlo",
        },
        {
          label: "No muestra luz",
          query: "No muestra luz al conectarlo",
        },
        {
          label: "Agendar revision",
          query: "Quiero agendar una revision",
        },
      ],
    },
  },
  {
    intent: "POWER_LIGHT_YES",
    keywords: [
      "si muestra luz",
      "tiene luz",
      "enciende luz",
      "luz al conectarlo",
    ],
    reply: {
      text: "Si muestra luz pero no enciende, puede haber un problema de pantalla, memoria, disco o sistema. Te recomiendo agendar una revision para diagnosticarlo.",
      actions: [
        {
          label: "Agendar revision",
          to: "/client",
        },
      ],
    },
  },
  {
    intent: "POWER_LIGHT_NO",
    keywords: ["no muestra luz", "sin luz", "ninguna luz", "no tiene luz"],
    reply: {
      text: "Si no muestra ninguna luz, puede ser cargador, bateria, conector de carga o placa de energia. Evita seguir intentando si hay olor a quemado o calentamiento.",
      actions: [
        {
          label: "Agendar revision",
          to: "/client",
        },
      ],
    },
  },
  {
    intent: "SCREEN_ISSUE",
    keywords: [
      "pantalla negra",
      "sin imagen",
      "no da imagen",
      "lineas",
      "parpadea",
      "pantalla rota",
    ],
    reply: {
      text: "Puede ser falla de pantalla, cable flex, tarjeta grafica o configuracion de video. Si el equipo enciende, prueba conectar una pantalla externa antes de agendar.",
      options: [
        {
          label: "Enciende pero sin imagen",
          query: "Mi equipo enciende pero no da imagen",
        },
        {
          label: "Agendar revision",
          query: "Quiero agendar una revision",
        },
      ],
    },
  },
  {
    intent: "SLOW_DEVICE",
    keywords: ["lento", "se pega", "demora", "congelado", "trabado"],
    reply: {
      text: "La lentitud puede deberse a poco espacio, programas en segundo plano, virus, disco dañado o falta de mantencion. Te recomiendo respaldar tus archivos importantes y solicitar una revision.",
      actions: [
        {
          label: "Agendar revision",
          to: "/client",
        },
      ],
    },
  },
  {
    intent: "OVERHEATING",
    keywords: [
      "calienta",
      "temperatura",
      "sobrecalienta",
      "ventilador",
      "muy caliente",
    ],
    reply: {
      text: "El sobrecalentamiento suele relacionarse con polvo, pasta termica seca o ventilacion obstruida. Evita usar el equipo sobre telas y considera una mantencion preventiva.",
      actions: [
        {
          label: "Agendar mantencion",
          to: "/client",
        },
      ],
    },
  },
  {
    intent: "CHARGING_ISSUE",
    keywords: ["no carga", "cargador", "bateria", "enchufe", "conector"],
    reply: {
      text: "Si el equipo no carga, prueba otro enchufe y revisa si el cargador o conector estan sueltos o dañados. Si el problema sigue, puede requerir revision tecnica.",
      actions: [
        {
          label: "Agendar revision",
          to: "/client",
        },
      ],
    },
  },
  {
    intent: "INTERNET_ISSUE",
    keywords: ["internet", "wifi", "wi fi", "conexion", "red"],
    reply: {
      text: "Si no conecta a internet, reinicia el router, verifica si otros equipos tienen conexion y revisa que el WiFi este activado. Si solo falla este equipo, puede ser controlador o configuracion.",
    },
  },
  {
    intent: "NOISE_ISSUE",
    keywords: ["ruido", "suena", "zumbido", "ventilador fuerte", "traqueteo"],
    reply: {
      text: "Un ruido extraño puede venir del ventilador, disco mecanico o piezas sueltas. Si el sonido es fuerte o aparece de repente, evita usar el equipo mucho tiempo y agenda una revision.",
      actions: [
        {
          label: "Agendar revision",
          to: "/client",
        },
      ],
    },
  },
  {
    intent: "VIRUS_ISSUE",
    keywords: ["virus", "publicidad", "ventanas", "malware", "infectado"],
    reply: {
      text: "Si aparecen ventanas extrañas, publicidad o programas desconocidos, podria tratarse de malware. Evita ingresar contraseñas hasta revisar el equipo.",
      actions: [
        {
          label: "Agendar revision",
          to: "/client",
        },
      ],
    },
  },
  {
    intent: "KEYBOARD_ISSUE",
    keywords: ["teclado", "mouse", "touchpad", "no escribe", "teclas"],
    reply: {
      text: "Si teclado, mouse o touchpad fallan, prueba reiniciar, conectar un periferico externo y revisar si hubo derrame de liquido. Si persiste, requiere revision.",
      actions: [
        {
          label: "Agendar revision",
          to: "/client",
        },
      ],
    },
  },
];

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findKnowledgeItem(query: string) {
  const text = normalizeText(query);

  let bestMatch: { item: KnowledgeItem; score: number } | null = null;

  for (const item of knowledgeBase) {
    const score = item.keywords.reduce((total, keyword) => {
      const normalizedKeyword = normalizeText(keyword);

      if (!text.includes(normalizedKeyword)) {
        return total;
      }

      return total + normalizedKeyword.length;
    }, 0);

    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = {
        item,
        score,
      };
    }
  }

  return bestMatch?.item;
}

function buildFallbackReply(id: number): Message {
  return {
    id,
    from: "bot",
    text: "No tengo una respuesta exacta para esa consulta. Te recomiendo contactar soporte o agendar una revision tecnica para recibir ayuda personalizada.",
    actions: [
      {
        label: "Login",
        to: "/login",
      },
      {
        label: "Registro",
        to: "/register",
      },
    ],
  };
}

function buildBotReply(query: string, id: number): Message {
  const item = findKnowledgeItem(query);

  if (!item) {
    return buildFallbackReply(id);
  }

  return {
    id,
    from: "bot",
    text: item.reply.text,
    actions: item.reply.actions,
    options: item.reply.options,
  };
}

export function ClientChatBot() {
  const messageIdRef = useRef(2);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages]);

  function getNextMessageId() {
    const id = messageIdRef.current;

    messageIdRef.current += 1;

    return id;
  }

  function sendMessage(query: string) {
    const text = query.trim();

    if (!text) {
      return;
    }

    const userMessage: Message = {
      id: getNextMessageId(),
      from: "user",
      text,
    };

    const botMessage = buildBotReply(text, getNextMessageId());

    setMessages((prev) => [...prev, userMessage, botMessage]);

    setInput("");
  }

  function handleSend() {
    sendMessage(input);
  }

  function handleQuickQuestion(query: string) {
    sendMessage(query);
  }

  function handleClear() {
    setMessages(initialMessages);
    messageIdRef.current = 2;
  }

  return (
    <div className="chatbot">
      {open && (
        <section className="chatbot-window">
          <header className="chatbot-header">
            <div>
              <strong>Asistente Agenda2SAS</strong>
              <p>Orientacion para clientes</p>
            </div>

            <button type="button" onClick={() => setOpen(false)}>
              Cerrar
            </button>
          </header>

          <div className="chatbot-quick">
            {quickQuestions.map((question) => (
              <button
                key={question.label}
                type="button"
                onClick={() => handleQuickQuestion(question.query)}
              >
                {question.label}
              </button>
            ))}
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message chatbot-message-${message.from}`}
              >
                <p>{message.text}</p>

                {message.options && (
                  <div className="chatbot-actions">
                    {message.options.map((option) => (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => sendMessage(option.query)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                {message.actions && (
                  <div className="chatbot-actions">
                    {message.actions.map((action) => (
                      <Link key={action.label} to={action.to}>
                        {action.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-form">
            <input
              placeholder="Describe tu duda o falla..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
            />

            <button type="button" onClick={handleSend}>
              Enviar
            </button>
          </div>

          <button className="chatbot-clear" type="button" onClick={handleClear}>
            Limpiar conversacion
          </button>
        </section>
      )}

      <button
        className="chatbot-toggle"
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        Ayuda
      </button>
    </div>
  );
}
