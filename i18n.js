const STORAGE_KEY = "af_lang";
const PARAM_KEY = "lang";

export const SUPPORTED_LANGS = ["es", "en", "fr", "de", "pt", "it", "zh"];

const DICT = {
  es: {
    langName: "Español",
    common: {
      menu: "Menú",
      language: "Idioma",
      nav: {
        home: "Inicio",
        synopsis: "Sinopsis",
        fullReading: "Lectura Completa",
        epilogue: "Epílogo",
        reviews: "Reseñas",
        buy: "Comprar",
        login: "Login"
      },
      actions: {
        buyNow: "Comprar ahora",
        goToBuy: "Ir a Comprar"
      }
    },
    pages: {
      index: {
        title: "Abel de Ferro | Alias Literario",
        eyebrow: "Alias Literario",
        heading: "Abel de Ferro",
        byline: "Seudonimo Hermetico",
        tagline: "Historias para quienes no aceptan la mentira como destino.",
        lead: "Bajo este alias, la escritura explora la violencia invisible, el poder afectivo y la reconstruccion de la dignidad en relaciones complejas, con una voz clara, humana y clinica.",
        synopsisTitle: "Mision y Voz del Alias",
        synopsisBody: "Abel de Ferro escribe para nombrar lo que suele callarse: coercion emocional, manipulacion y fracturas de identidad en vinculos afectivos. El proposito no es estetizar el dano, sino traducirlo en lenguaje comprensible para quien necesita entender lo que vivio y recuperar agencia.",
        quote: "\"No fue un grito lo que rompió el espejo; fue la costumbre de hablar en voz baja.\"",
        authorTitle: "Biografia Curada",
        authorBody: "Escrito en tercera persona para sostener la distancia del personaje, Abel de Ferro desarrolla una narrativa de precision emocional y estructura literaria. Su trabajo combina observacion psicologica, ritmo narrativo y una etica clara: no romantizar la violencia que se disfraza de amor.",
        footer: "© 2026 Abel de Ferro. Alias literario."
      },
      ventas: {
        title: "Comprar | Abel de Ferro",
        eyebrow: "Compra oficial",
        loadingProduct: "Cargando producto...",
        buyBook: "Compra del Libro",
        buyBookLead: "Hay un único libro activo en este momento, con arquitectura lista para ampliar catálogo.",
        transparency: "Aviso de Transparencia",
        optionalEmbed: "Embed Opcional de Checkout",
        embedHint: "<!-- Inserta aquí tu código de Stripe Checkout embebido o Gumroad -->"
      },
      lectura: {
        title: "Lectura Completa | Abel de Ferro",
        eyebrow: "Contenido protegido",
        heading: "Lectura Completa",
        descriptionTitle: "Descripción del Libro",
        prologueTitle: "Prólogo (vista pública)",
        epilogueTitle: "Epílogo (vista pública)",
        lockedTitle: "Acceso no habilitado",
        lockedBody: "Para desbloquear el libro completo, realiza la compra y vuelve a esta sección.",
        fullTextTitle: "Texto completo"
      },
      epilogo: {
        title: "Epílogo | Abel de Ferro",
        eyebrow: "Cierre de obra",
        heading: "Epílogo",
        autoLoad: "Cargado automáticamente desde el manuscrito principal.",
        loading: "Cargando epílogo..."
      },
      reviews: {
        title: "Reseñas | Abel de Ferro",
        heading: "Sistema de Reseñas",
        intro: "Solo usuarios autenticados pueden enviar reseñas.",
        authChecking: "Verificando autenticación...",
        name: "Nombre",
        rating: "Valoración",
        comment: "Comentario",
        submit: "Publicar reseña",
        realtimeTitle: "Reseñas en tiempo real",
        realtimeBody: "Conectadas con Supabase.",
        star5: "5 estrellas",
        star4: "4 estrellas",
        star3: "3 estrellas",
        star2: "2 estrellas",
        star1: "1 estrella"
      },
      login: {
        title: "Login | Abel de Ferro",
        heading: "Acceso de Lectores",
        intro: "Inicia sesión para publicar reseñas y participar en la comunidad.",
        notice: "Si no tienes cuenta, puedes registrarte con email y contraseña.",
        google: "Entrar con Google",
        logout: "Cerrar sesión",
        email: "Email",
        password: "Contraseña",
        loginEmail: "Entrar con Email",
        createAccount: "Crear cuenta",
        forgot: "¿Olvidaste tu contraseña?"
      }
    },
    dynamic: {
      buy: {
        setupCta: "Configurar enlace de pago",
        grantedAccess: "Acceso otorgado",
        activeAccess: "Acceso activo al libro completo. Puedes entrar desde <a href=\"lectura.html\" class=\"underline\">Lectura Completa</a>.",
        pendingAccess: "Acceso no activo todavía. Completa la compra para habilitar <strong>Lectura Completa</strong>.",
        checkoutHint: "<strong>Tras completar el pago:</strong> tu acceso se activa automáticamente y puedes empezar a leer al instante.<br><br><span class=\"text-slate-600\">Si no se desbloquea al momento, recarga la página e inicia sesión de nuevo.</span>",
        productSubtitle: "Producto único activo ahora mismo. Plataforma: {platform}."
      },
      lectura: {
        loadError: "No se pudo cargar el libro completo.",
        active: "Acceso activo. Ya puedes leer el contenido completo.",
        pending: "Acceso pendiente. Activa tu compra en <a href=\"ventas.html\" class=\"underline\">Comprar</a> para desbloquear esta sección.",
        noPrologue: "Prólogo no disponible.",
        noEpilogue: "Epílogo no disponible.",
        prologueError: "Error al cargar prólogo: {message}",
        epilogueError: "Error al cargar epílogo: {message}"
      },
      epilogo: {
        noFound: "No se encontró el epílogo en el manuscrito.",
        readError: "No se pudo leer el manuscrito.",
        loadError: "No se pudo cargar el epílogo: {message}"
      },
      login: {
        sessionActive: "Sesión activa: {email}.",
        noSession: "No hay sesión activa.",
        redirectGoogle: "Redirigiendo a Google...",
        googleError: "Error con Google: {message}",
        fillEmailPassword: "Completa email y contraseña.",
        loginError: "No se pudo iniciar sesión: {message}",
        loginOk: "Sesión iniciada con email.",
        registerError: "No se pudo crear la cuenta: {message}",
        registerOk: "Cuenta creada correctamente. Revisa tu correo para confirmar.",
        logoutOk: "Sesión cerrada.",
        logoutError: "No se pudo cerrar sesión: {message}",
        fillResetEmail: "Introduce tu email para recuperar la contraseña.",
        resetError: "No se pudo enviar el correo: {message}",
        resetOk: "Correo de recuperación enviado. Revisa tu bandeja de entrada."
      },
      reviews: {
        none: "Aún no hay reseñas. Sé la primera persona en comentar.",
        firebaseConfig: "Reseñas conectadas con Supabase.",
        readError: "Error al leer reseñas: {message}",
        disabledPublic: "Publicación de reseñas no habilitada en esta versión pública.",
        connectedAs: "Conectado como {email}. Ya puedes publicar reseñas.",
        mustLogin: "Debes iniciar sesión para escribir reseñas. Ve a <a href=\"login.html\" class=\"underline\">Login</a>.",
        needLoginToPost: "Necesitas iniciar sesión para publicar.",
        completeFields: "Completa nombre y comentario.",
        publishOk: "Reseña publicada correctamente.",
        publishError: "No se pudo publicar la reseña: {message}"
      }
    },
    product: {
      name: "Sombra en el Espejo",
      description: "Compra única para habilitar acceso al libro completo en la plataforma.",
      publicDescription: "Sombra en el Espejo explora la violencia psicológica, la manipulación emocional y la recuperación de la dignidad personal desde una narrativa técnica y testimonial.",
      benefits: [
        { title: "Libro Completo", badge: "Acceso total", description: "Desbloquea la lectura completa dentro del sitio." },
        { title: "Formato Digital", badge: "Lectura inmediata", description: "Consulta online tras activar la compra." },
        { title: "Base Escalable", badge: "Preparado a futuro", description: "Catálogo listo para añadir nuevos libros o proyectos." }
      ],
      transparency: "Los fondos se destinan a edición, producción, distribución y mantenimiento del proyecto editorial. Los pagos se procesan mediante pasarela segura cifrada."
    }
  },
  en: {
    langName: "English",
    common: { menu: "Menu", language: "Language", nav: { home: "Home", synopsis: "Synopsis", fullReading: "Full Reading", epilogue: "Epilogue", reviews: "Reviews", buy: "Buy", login: "Login" }, actions: { buyNow: "Buy now", goToBuy: "Go to Buy" } },
    pages: { index: { title: "Abel de Ferro | Literary Alias", eyebrow: "Literary Alias", heading: "Abel de Ferro", byline: "Hermetic Pen Name", tagline: "Stories for those who refuse to accept lies as fate.", lead: "Under this alias, the writing explores invisible violence, affective power and the rebuilding of dignity in complex relationships, with a clear and human voice.", synopsisTitle: "Mission and Voice", synopsisBody: "Abel de Ferro writes to name what is usually silenced: emotional coercion, manipulation and identity fractures in intimate bonds. The goal is not to aestheticize harm, but to translate it into clear language for those who need to understand what they lived and reclaim agency.", quote: "\"It was not a scream that broke the mirror; it was the habit of speaking softly.\"", authorTitle: "Curated Biography", authorBody: "Written in third person to preserve the character distance, Abel de Ferro develops precise emotional storytelling with literary structure. The work combines psychological observation, narrative rhythm and a clear ethic: do not romanticize violence disguised as love.", footer: "© 2026 Abel de Ferro. Literary alias." }, ventas: { title: "Buy | Abel de Ferro", eyebrow: "Official purchase", loadingProduct: "Loading product...", buyBook: "Buy the Book", buyBookLead: "There is one active book right now.", transparency: "Transparency Notice", optionalEmbed: "Optional Checkout Embed", embedHint: "<!-- Insert your Stripe Checkout embed or Gumroad code here -->" }, lectura: { title: "Full Reading | Abel de Ferro", eyebrow: "Protected content", heading: "Full Reading", descriptionTitle: "Book Description", prologueTitle: "Prologue (public preview)", epilogueTitle: "Epilogue (public preview)", lockedTitle: "Access not enabled", lockedBody: "To unlock the full book, complete the purchase and return here.", fullTextTitle: "Full text" }, epilogo: { title: "Epilogue | Abel de Ferro", eyebrow: "Work closure", heading: "Epilogue", autoLoad: "Loaded automatically from the main manuscript.", loading: "Loading epilogue..." }, reviews: { title: "Reviews | Abel de Ferro", heading: "Review System", intro: "Only authenticated users can post reviews.", authChecking: "Checking authentication...", name: "Name", rating: "Rating", comment: "Comment", submit: "Publish review", realtimeTitle: "Real-time reviews", realtimeBody: "Connected to Supabase.", star5: "5 stars", star4: "4 stars", star3: "3 stars", star2: "2 stars", star1: "1 star" }, login: { title: "Login | Abel de Ferro", heading: "Reader Access", intro: "Sign in to publish reviews and join the community.", notice: "If you do not have an account, register with email and password.", google: "Continue with Google", logout: "Sign out", email: "Email", password: "Password", loginEmail: "Sign in with Email", createAccount: "Create account", forgot: "Forgot your password?" } },
    dynamic: { buy: { setupCta: "Set payment link", grantedAccess: "Granted access", activeAccess: "Access active for the full book. You can enter from <a href=\"lectura.html\" class=\"underline\">Full Reading</a>.", pendingAccess: "Access not active yet. Complete the purchase to unlock <strong>Full Reading</strong>.", checkoutHint: "<strong>After payment:</strong> your access is activated automatically and you can start reading right away.<br><br><span class=\"text-slate-600\">If access does not unlock, refresh this page and log in again.</span>", productSubtitle: "Single active product right now. Platform: {platform}." }, lectura: { loadError: "Could not load the full book.", active: "Access active. You can now read the full content.", pending: "Access pending. Activate your purchase in <a href=\"ventas.html\" class=\"underline\">Buy</a> to unlock this section.", noPrologue: "Prologue not available.", noEpilogue: "Epilogue not available.", prologueError: "Error loading prologue: {message}", epilogueError: "Error loading epilogue: {message}" }, epilogo: { noFound: "Epilogue not found in manuscript.", readError: "Could not read manuscript.", loadError: "Could not load epilogue: {message}" }, login: { sessionActive: "Active session: {email}.", noSession: "No active session.", redirectGoogle: "Redirecting to Google...", googleError: "Google error: {message}", fillEmailPassword: "Complete email and password.", loginError: "Could not sign in: {message}", loginOk: "Signed in with email.", registerError: "Could not create account: {message}", registerOk: "Account created. Check your email to confirm.", logoutOk: "Session closed.", logoutError: "Could not sign out: {message}", fillResetEmail: "Enter your email to recover your password.", resetError: "Could not send email: {message}", resetOk: "Recovery email sent. Check your inbox." }, reviews: { none: "No reviews yet. Be the first to comment.", firebaseConfig: "Reviews connected to Supabase.", readError: "Error reading reviews: {message}", disabledPublic: "Review publishing is not enabled in this public version.", connectedAs: "Signed in as {email}. You can now post reviews.", mustLogin: "You must sign in to write reviews. Go to <a href=\"login.html\" class=\"underline\">Login</a>.", needLoginToPost: "You need to sign in to publish.", completeFields: "Fill name and comment.", publishOk: "Review published successfully.", publishError: "Could not publish review: {message}" } },
    product: { name: "Shadow in the Mirror", description: "One-time purchase to unlock full reading on the platform.", publicDescription: "Shadow in the Mirror explores psychological violence and emotional manipulation.", benefits: [{ title: "Full Book", badge: "Full access", description: "Unlock complete reading on site." }, { title: "Digital Format", badge: "Instant reading", description: "Read online after purchase activation." }, { title: "Scalable Base", badge: "Future-ready", description: "Catalog ready for more books and projects." }], transparency: "Funds support editing, production, distribution, and maintenance. Payments are securely processed." }
  }
};


// Traducciones reales para francés
DICT.fr = {
  langName: "Français",
  common: { menu: "Menu", language: "Langue", nav: { home: "Accueil", synopsis: "Synopsis", fullReading: "Lecture complète", epilogue: "Épilogue", reviews: "Avis", buy: "Acheter", login: "Connexion" }, actions: { buyNow: "Acheter maintenant", goToBuy: "Aller à l'achat" } },
  pages: { index: { title: "Abel de Ferro | Ombre dans le Miroir", eyebrow: "Roman psychologique", byline: "Par Abel de Ferro", tagline: "Chaque reflet cache un pacte invisible. Chaque silence aussi.", lead: "Une histoire qui plonge dans la violence psychologique sous un angle intime.", synopsisTitle: "Synopsis", synopsisBody: "Ombre dans le Miroir explore le contrôle émotionnel et la dépendance.", quote: "\"Ce n'est pas un cri qui a brisé le miroir ; c'est l'habitude de parler doucement.\"", authorTitle: "À propos d'Abel de Ferro", authorBody: "Abel de Ferro explore les récits de tension émotionnelle.", footer: "© 2026 Abel de Ferro. Auteur de Ombre dans le Miroir." }, ventas: { title: "Acheter | Abel de Ferro", eyebrow: "Achat officiel", loadingProduct: "Chargement du produit...", buyBook: "Acheter le livre", buyBookLead: "Il y a un livre actif en ce moment.", transparency: "Avis de transparence", optionalEmbed: "Intégration de paiement optionnelle", embedHint: "<!-- Insérez ici votre code Stripe Checkout ou Gumroad -->" }, lectura: { title: "Lecture complète | Abel de Ferro", eyebrow: "Contenu protégé", heading: "Lecture complète", descriptionTitle: "Description du livre", prologueTitle: "Prologue (aperçu public)", epilogueTitle: "Épilogue (aperçu public)", lockedTitle: "Accès non activé", lockedBody: "Pour débloquer le livre complet, effectuez l'achat et revenez ici.", fullTextTitle: "Texte complet" }, epilogo: { title: "Épilogue | Abel de Ferro", eyebrow: "Clôture de l'œuvre", heading: "Épilogue", autoLoad: "Chargé automatiquement depuis le manuscrit principal.", loading: "Chargement de l'épilogue..." }, reviews: { title: "Avis | Abel de Ferro", heading: "Système d'avis", intro: "Seuls les utilisateurs authentifiés peuvent publier des avis.", authChecking: "Vérification de l'authentification...", name: "Nom", rating: "Évaluation", comment: "Commentaire", submit: "Publier l'avis", realtimeTitle: "Avis en temps réel", realtimeBody: "Connecté à Supabase.", star5: "5 étoiles", star4: "4 étoiles", star3: "3 étoiles", star2: "2 étoiles", star1: "1 étoile" }, login: { title: "Connexion | Abel de Ferro", heading: "Accès des lecteurs", intro: "Connectez-vous pour publier des avis et participer à la communauté.", notice: "Si vous n'avez pas de compte, inscrivez-vous avec votre email et mot de passe.", google: "Se connecter avec Google", logout: "Déconnexion", email: "Email", password: "Mot de passe", loginEmail: "Connexion par email", createAccount: "Créer un compte", forgot: "Mot de passe oublié ?" } },
  dynamic: { buy: { setupCta: "Configurer le lien de paiement", grantedAccess: "Accès accordé", activeAccess: "Accès actif au livre complet. Vous pouvez entrer depuis <a href=\"lectura.html\" class=\"underline\">Lecture complète</a>.", pendingAccess: "Accès non encore activé. Complétez l'achat pour débloquer <strong>Lecture complète</strong>.", checkoutHint: "<strong>Après le paiement :</strong> votre accès est activé automatiquement et vous pouvez commencer à lire immédiatement.<br><br><span class=\"text-slate-600\">Si l'accès ne se débloque pas, actualisez la page et reconnectez-vous.</span>", productSubtitle: "Produit unique actif actuellement. Plateforme : {platform}." }, lectura: { loadError: "Impossible de charger le livre complet.", active: "Accès actif. Vous pouvez maintenant lire le contenu complet.", pending: "Accès en attente. Activez votre achat dans <a href=\"ventas.html\" class=\"underline\">Acheter</a> pour débloquer cette section.", noPrologue: "Prologue non disponible.", noEpilogue: "Épilogue non disponible.", prologueError: "Erreur de chargement du prologue : {message}", epilogueError: "Erreur de chargement de l'épilogue : {message}" }, epilogo: { noFound: "Épilogue introuvable dans le manuscrit.", readError: "Impossible de lire le manuscrit.", loadError: "Impossible de charger l'épilogue : {message}" }, login: { sessionActive: "Session active : {email}.", noSession: "Aucune session active.", redirectGoogle: "Redirection vers Google...", googleError: "Erreur Google : {message}", fillEmailPassword: "Complétez l'email et le mot de passe.", loginError: "Impossible de se connecter : {message}", loginOk: "Session ouverte avec email.", registerError: "Impossible de créer le compte : {message}", registerOk: "Compte créé. Vérifiez votre email pour confirmer.", logoutOk: "Session fermée.", logoutError: "Impossible de fermer la session : {message}", fillResetEmail: "Entrez votre email pour récupérer le mot de passe.", resetError: "Impossible d'envoyer l'email : {message}", resetOk: "Email de récupération envoyé. Vérifiez votre boîte de réception." }, reviews: { none: "Pas encore d'avis. Soyez le premier à commenter.", firebaseConfig: "Avis connectés à Supabase.", readError: "Erreur de lecture des avis : {message}", disabledPublic: "Publication d'avis non activée dans cette version publique.", connectedAs: "Connecté en tant que {email}. Vous pouvez maintenant publier des avis.", mustLogin: "Vous devez vous connecter pour écrire des avis. Allez à <a href=\"login.html\" class=\"underline\">Connexion</a>.", needLoginToPost: "Vous devez vous connecter pour publier.", completeFields: "Complétez le nom et le commentaire.", publishOk: "Avis publié avec succès.", publishError: "Impossible de publier l'avis : {message}" } },
  product: { name: "Ombre dans le Miroir", description: "Achat unique pour débloquer la lecture complète sur la plateforme.", publicDescription: "Ombre dans le Miroir explore la violence psychologique et la manipulation émotionnelle.", benefits: [{ title: "Livre complet", badge: "Accès total", description: "Débloquez la lecture complète sur le site." }, { title: "Format numérique", badge: "Lecture instantanée", description: "Lisez en ligne après l'activation de l'achat." }, { title: "Base évolutive", badge: "Prêt pour l'avenir", description: "Catalogue prêt pour plus de livres et de projets." }], transparency: "Les fonds servent à l'édition, la production, la distribution et la maintenance. Les paiements sont traités en toute sécurité." }
};

// Traducciones reales para alemán
DICT.de = {
  langName: "Deutsch",
  common: { menu: "Menü", language: "Sprache", nav: { home: "Startseite", synopsis: "Zusammenfassung", fullReading: "Vollständige Lektüre", epilogue: "Epilog", reviews: "Bewertungen", buy: "Kaufen", login: "Anmelden" }, actions: { buyNow: "Jetzt kaufen", goToBuy: "Zum Kauf" } },
  pages: { index: { title: "Abel de Ferro | Schatten im Spiegel", eyebrow: "Psychologischer Roman", byline: "Von Abel de Ferro", tagline: "Jeder Spiegel verbirgt einen unsichtbaren Pakt. Auch jedes Schweigen.", lead: "Eine Geschichte, die psychische Gewalt aus einer intimen Perspektive beleuchtet.", synopsisTitle: "Zusammenfassung", synopsisBody: "Schatten im Spiegel erforscht emotionale Kontrolle und Abhängigkeit.", quote: "\"Nicht ein Schrei zerbrach den Spiegel, sondern die Gewohnheit, leise zu sprechen.\"", authorTitle: "Über Abel de Ferro", authorBody: "Abel de Ferro erforscht Erzählungen emotionaler Spannung.", footer: "© 2026 Abel de Ferro. Autor von Schatten im Spiegel." }, ventas: { title: "Kaufen | Abel de Ferro", eyebrow: "Offizieller Kauf", loadingProduct: "Produkt wird geladen...", buyBook: "Buch kaufen", buyBookLead: "Derzeit ist ein Buch aktiv.", transparency: "Transparenzhinweis", optionalEmbed: "Optionale Checkout-Einbettung", embedHint: "<!-- Fügen Sie hier Ihren Stripe Checkout- oder Gumroad-Code ein -->" }, lectura: { title: "Vollständige Lektüre | Abel de Ferro", eyebrow: "Geschützter Inhalt", heading: "Vollständige Lektüre", descriptionTitle: "Buchbeschreibung", prologueTitle: "Prolog (öffentliche Vorschau)", epilogueTitle: "Epilog (öffentliche Vorschau)", lockedTitle: "Zugang nicht aktiviert", lockedBody: "Um das vollständige Buch freizuschalten, schließen Sie den Kauf ab und kehren Sie hierher zurück.", fullTextTitle: "Vollständiger Text" }, epilogo: { title: "Epilog | Abel de Ferro", eyebrow: "Abschluss des Werks", heading: "Epilog", autoLoad: "Automatisch aus dem Hauptmanuskript geladen.", loading: "Epilog wird geladen..." }, reviews: { title: "Bewertungen | Abel de Ferro", heading: "Bewertungssystem", intro: "Nur authentifizierte Nutzer können Bewertungen abgeben.", authChecking: "Authentifizierung wird überprüft...", name: "Name", rating: "Bewertung", comment: "Kommentar", submit: "Bewertung veröffentlichen", realtimeTitle: "Echtzeit-Bewertungen", realtimeBody: "Verbunden mit Supabase.", star5: "5 Sterne", star4: "4 Sterne", star3: "3 Sterne", star2: "2 Sterne", star1: "1 Stern" }, login: { title: "Anmelden | Abel de Ferro", heading: "Leserzugang", intro: "Melden Sie sich an, um Bewertungen zu veröffentlichen und an der Community teilzunehmen.", notice: "Wenn Sie kein Konto haben, registrieren Sie sich mit E-Mail und Passwort.", google: "Mit Google anmelden", logout: "Abmelden", email: "E-Mail", password: "Passwort", loginEmail: "Mit E-Mail anmelden", createAccount: "Konto erstellen", forgot: "Passwort vergessen?" } },
  dynamic: { buy: { setupCta: "Zahlungslink einrichten", grantedAccess: "Zugang gewährt", activeAccess: "Zugang zum vollständigen Buch aktiv. Sie können über <a href=\"lectura.html\" class=\"underline\">Vollständige Lektüre</a> zugreifen.", pendingAccess: "Zugang noch nicht aktiv. Schließen Sie den Kauf ab, um <strong>Vollständige Lektüre</strong> freizuschalten.", checkoutHint: "<strong>Nach der Zahlung:</strong> Ihr Zugang wird automatisch aktiviert und Sie können sofort mit dem Lesen beginnen.<br><br><span class=\"text-slate-600\">Wenn der Zugang nicht freigeschaltet wird, aktualisieren Sie die Seite und melden Sie sich erneut an.</span>", productSubtitle: "Derzeit nur ein aktives Produkt. Plattform: {platform}." }, lectura: { loadError: "Das vollständige Buch konnte nicht geladen werden.", active: "Zugang aktiv. Sie können jetzt den vollständigen Inhalt lesen.", pending: "Zugang ausstehend. Aktivieren Sie Ihren Kauf unter <a href=\"ventas.html\" class=\"underline\">Kaufen</a>, um diesen Bereich freizuschalten.", noPrologue: "Prolog nicht verfügbar.", noEpilogue: "Epilog nicht verfügbar.", prologueError: "Fehler beim Laden des Prologs: {message}", epilogueError: "Fehler beim Laden des Epilogs: {message}" }, epilogo: { noFound: "Epilog im Manuskript nicht gefunden.", readError: "Manuskript konnte nicht gelesen werden.", loadError: "Epilog konnte nicht geladen werden: {message}" }, login: { sessionActive: "Aktive Sitzung: {email}.", noSession: "Keine aktive Sitzung.", redirectGoogle: "Weiterleitung zu Google...", googleError: "Google-Fehler: {message}", fillEmailPassword: "E-Mail und Passwort ausfüllen.", loginError: "Anmeldung fehlgeschlagen: {message}", loginOk: "Mit E-Mail angemeldet.", registerError: "Konto konnte nicht erstellt werden: {message}", registerOk: "Konto erstellt. Überprüfen Sie Ihre E-Mails zur Bestätigung.", logoutOk: "Sitzung beendet.", logoutError: "Abmeldung fehlgeschlagen: {message}", fillResetEmail: "Geben Sie Ihre E-Mail ein, um das Passwort wiederherzustellen.", resetError: "E-Mail konnte nicht gesendet werden: {message}", resetOk: "Wiederherstellungs-E-Mail gesendet. Überprüfen Sie Ihren Posteingang." }, reviews: { none: "Noch keine Bewertungen. Seien Sie der Erste, der kommentiert.", firebaseConfig: "Bewertungen mit Supabase verbunden.", readError: "Fehler beim Lesen der Bewertungen: {message}", disabledPublic: "Bewertungen sind in dieser öffentlichen Version nicht aktiviert.", connectedAs: "Angemeldet als {email}. Sie können jetzt Bewertungen veröffentlichen.", mustLogin: "Sie müssen sich anmelden, um Bewertungen zu schreiben. Gehen Sie zu <a href=\"login.html\" class=\"underline\">Anmelden</a>.", needLoginToPost: "Sie müssen sich anmelden, um zu veröffentlichen.", completeFields: "Name und Kommentar ausfüllen.", publishOk: "Bewertung erfolgreich veröffentlicht.", publishError: "Bewertung konnte nicht veröffentlicht werden: {message}" } },
  product: { name: "Schatten im Spiegel", description: "Einmalkauf zum Freischalten der vollständigen Lektüre auf der Plattform.", publicDescription: "Schatten im Spiegel erforscht psychische Gewalt und emotionale Manipulation.", benefits: [{ title: "Vollständiges Buch", badge: "Voller Zugang", description: "Schalten Sie die vollständige Lektüre auf der Website frei." }, { title: "Digitales Format", badge: "Sofortige Lektüre", description: "Lesen Sie online nach Aktivierung des Kaufs." }, { title: "Skalierbare Basis", badge: "Zukunftssicher", description: "Katalog bereit für weitere Bücher und Projekte." }], transparency: "Die Mittel werden für Redaktion, Produktion, Vertrieb und Wartung verwendet. Zahlungen werden sicher verarbeitet." }
};

// Traducciones reales para portugués
DICT.pt = {
  langName: "Português",
  common: { menu: "Menu", language: "Idioma", nav: { home: "Início", synopsis: "Sinopse", fullReading: "Leitura completa", epilogue: "Epílogo", reviews: "Avaliações", buy: "Comprar", login: "Entrar" }, actions: { buyNow: "Comprar agora", goToBuy: "Ir para compra" } },
  pages: { index: { title: "Abel de Ferro | Sombra no Espelho", eyebrow: "Romance psicológico", byline: "Por Abel de Ferro", tagline: "Todo reflexo esconde um pacto invisível. Todo silêncio também.", lead: "Uma história que mergulha na violência psicológica de uma perspectiva íntima.", synopsisTitle: "Sinopse", synopsisBody: "Sombra no Espelho explora o controle emocional e a dependência.", quote: "\"Não foi um grito que quebrou o espelho; foi o hábito de falar baixo.\"", authorTitle: "Sobre Abel de Ferro", authorBody: "Abel de Ferro explora narrativas de tensão emocional.", footer: "© 2026 Abel de Ferro. Autor de Sombra no Espelho." }, ventas: { title: "Comprar | Abel de Ferro", eyebrow: "Compra oficial", loadingProduct: "Carregando produto...", buyBook: "Comprar o livro", buyBookLead: "Há um livro ativo no momento.", transparency: "Aviso de transparência", optionalEmbed: "Checkout opcional incorporado", embedHint: "<!-- Insira aqui seu código Stripe Checkout ou Gumroad -->" }, lectura: { title: "Leitura completa | Abel de Ferro", eyebrow: "Conteúdo protegido", heading: "Leitura completa", descriptionTitle: "Descrição do livro", prologueTitle: "Prólogo (visualização pública)", epilogueTitle: "Epílogo (visualização pública)", lockedTitle: "Acesso não habilitado", lockedBody: "Para desbloquear o livro completo, conclua a compra e retorne aqui.", fullTextTitle: "Texto completo" }, epilogo: { title: "Epílogo | Abel de Ferro", eyebrow: "Encerramento da obra", heading: "Epílogo", autoLoad: "Carregado automaticamente do manuscrito principal.", loading: "Carregando epílogo..." }, reviews: { title: "Avaliações | Abel de Ferro", heading: "Sistema de avaliações", intro: "Apenas usuários autenticados podem enviar avaliações.", authChecking: "Verificando autenticação...", name: "Nome", rating: "Avaliação", comment: "Comentário", submit: "Publicar avaliação", realtimeTitle: "Avaliações em tempo real", realtimeBody: "Conectado ao Supabase.", star5: "5 estrelas", star4: "4 estrelas", star3: "3 estrelas", star2: "2 estrelas", star1: "1 estrela" }, login: { title: "Entrar | Abel de Ferro", heading: "Acesso de leitores", intro: "Faça login para publicar avaliações e participar da comunidade.", notice: "Se não tem conta, cadastre-se com email e senha.", google: "Entrar com Google", logout: "Sair", email: "Email", password: "Senha", loginEmail: "Entrar com Email", createAccount: "Criar conta", forgot: "Esqueceu a senha?" } },
  dynamic: { buy: { setupCta: "Configurar link de pagamento", grantedAccess: "Acesso concedido", activeAccess: "Acesso ativo ao livro completo. Você pode acessar em <a href=\"lectura.html\" class=\"underline\">Leitura completa</a>.", pendingAccess: "Acesso ainda não ativo. Conclua a compra para desbloquear <strong>Leitura completa</strong>.", checkoutHint: "<strong>Após o pagamento:</strong> seu acesso é ativado automaticamente e você pode começar a ler imediatamente.<br><br><span class=\"text-slate-600\">Se não desbloquear, recarregue a página e faça login novamente.</span>", productSubtitle: "Produto único ativo agora. Plataforma: {platform}." }, lectura: { loadError: "Não foi possível carregar o livro completo.", active: "Acesso ativo. Agora você pode ler o conteúdo completo.", pending: "Acesso pendente. Ative sua compra em <a href=\"ventas.html\" class=\"underline\">Comprar</a> para desbloquear esta seção.", noPrologue: "Prólogo não disponível.", noEpilogue: "Epílogo não disponível.", prologueError: "Erro ao carregar o prólogo: {message}", epilogueError: "Erro ao carregar o epílogo: {message}" }, epilogo: { noFound: "Epílogo não encontrado no manuscrito.", readError: "Não foi possível ler o manuscrito.", loadError: "Não foi possível carregar o epílogo: {message}" }, login: { sessionActive: "Sessão ativa: {email}.", noSession: "Nenhuma sessão ativa.", redirectGoogle: "Redirecionando para o Google...", googleError: "Erro do Google: {message}", fillEmailPassword: "Preencha email e senha.", loginError: "Não foi possível fazer login: {message}", loginOk: "Sessão iniciada com email.", registerError: "Não foi possível criar a conta: {message}", registerOk: "Conta criada. Verifique seu email para confirmar.", logoutOk: "Sessão encerrada.", logoutError: "Não foi possível encerrar a sessão: {message}", fillResetEmail: "Digite seu email para recuperar a senha.", resetError: "Não foi possível enviar o email: {message}", resetOk: "Email de recuperação enviado. Verifique sua caixa de entrada." }, reviews: { none: "Ainda não há avaliações. Seja o primeiro a comentar.", firebaseConfig: "Avaliações conectadas ao Supabase.", readError: "Erro ao ler avaliações: {message}", disabledPublic: "Publicação de avaliações não habilitada nesta versão pública.", connectedAs: "Conectado como {email}. Agora você pode publicar avaliações.", mustLogin: "Você precisa fazer login para escrever avaliações. Vá para <a href=\"login.html\" class=\"underline\">Entrar</a>.", needLoginToPost: "Você precisa fazer login para publicar.", completeFields: "Preencha nome e comentário.", publishOk: "Avaliação publicada com sucesso.", publishError: "Não foi possível publicar a avaliação: {message}" } },
  product: { name: "Sombra no Espelho", description: "Compra única para desbloquear a leitura completa na plataforma.", publicDescription: "Sombra no Espelho explora a violência psicológica e a manipulação emocional.", benefits: [{ title: "Livro completo", badge: "Acesso total", description: "Desbloqueie a leitura completa no site." }, { title: "Formato digital", badge: "Leitura imediata", description: "Leia online após ativar a compra." }, { title: "Base escalável", badge: "Pronto para o futuro", description: "Catálogo pronto para mais livros e projetos." }], transparency: "Os fundos são destinados à edição, produção, distribuição e manutenção. Os pagamentos são processados com segurança." }
};

// Traducciones reales para italiano
DICT.it = {
  langName: "Italiano",
  common: { menu: "Menu", language: "Lingua", nav: { home: "Home", synopsis: "Sinossi", fullReading: "Lettura completa", epilogue: "Epilogo", reviews: "Recensioni", buy: "Acquista", login: "Accedi" }, actions: { buyNow: "Acquista ora", goToBuy: "Vai all'acquisto" } },
  pages: { index: { title: "Abel de Ferro | Ombra nello Specchio", eyebrow: "Romanzo psicologico", byline: "Di Abel de Ferro", tagline: "Ogni riflesso nasconde un patto invisibile. Anche ogni silenzio.", lead: "Una storia che esplora la violenza psicologica da una prospettiva intima.", synopsisTitle: "Sinossi", synopsisBody: "Ombra nello Specchio esplora il controllo emotivo e la dipendenza.", quote: "\"Non è stato un grido a rompere lo specchio; è stata l'abitudine di parlare a bassa voce.\"", authorTitle: "Su Abel de Ferro", authorBody: "Abel de Ferro esplora narrazioni di tensione emotiva.", footer: "© 2026 Abel de Ferro. Autore di Ombra nello Specchio." }, ventas: { title: "Acquista | Abel de Ferro", eyebrow: "Acquisto ufficiale", loadingProduct: "Caricamento prodotto...", buyBook: "Acquista il libro", buyBookLead: "C'è un libro attivo al momento.", transparency: "Avviso di trasparenza", optionalEmbed: "Checkout opzionale incorporato", embedHint: "<!-- Inserisci qui il tuo codice Stripe Checkout o Gumroad -->" }, lectura: { title: "Lettura completa | Abel de Ferro", eyebrow: "Contenuto protetto", heading: "Lettura completa", descriptionTitle: "Descrizione del libro", prologueTitle: "Prologo (anteprima pubblica)", epilogueTitle: "Epilogo (anteprima pubblica)", lockedTitle: "Accesso non abilitato", lockedBody: "Per sbloccare il libro completo, completa l'acquisto e torna qui.", fullTextTitle: "Testo completo" }, epilogo: { title: "Epilogo | Abel de Ferro", eyebrow: "Chiusura dell'opera", heading: "Epilogo", autoLoad: "Caricato automaticamente dal manoscritto principale.", loading: "Caricamento epilogo..." }, reviews: { title: "Recensioni | Abel de Ferro", heading: "Sistema di recensioni", intro: "Solo gli utenti autenticati possono inviare recensioni.", authChecking: "Verifica autenticazione...", name: "Nome", rating: "Valutazione", comment: "Commento", submit: "Pubblica recensione", realtimeTitle: "Recensioni in tempo reale", realtimeBody: "Collegato a Supabase.", star5: "5 stelle", star4: "4 stelle", star3: "3 stelle", star2: "2 stelle", star1: "1 stella" }, login: { title: "Accedi | Abel de Ferro", heading: "Accesso lettori", intro: "Accedi per pubblicare recensioni e partecipare alla community.", notice: "Se non hai un account, registrati con email e password.", google: "Accedi con Google", logout: "Disconnetti", email: "Email", password: "Password", loginEmail: "Accedi con Email", createAccount: "Crea account", forgot: "Password dimenticata?" } },
  dynamic: { buy: { setupCta: "Configura link di pagamento", grantedAccess: "Accesso concesso", activeAccess: "Accesso attivo al libro completo. Puoi entrare da <a href=\"lectura.html\" class=\"underline\">Lettura completa</a>.", pendingAccess: "Accesso non ancora attivo. Completa l'acquisto per sbloccare <strong>Lettura completa</strong>.", checkoutHint: "<strong>Dopo il pagamento:</strong> il tuo accesso viene attivato automaticamente e puoi iniziare a leggere subito.<br><br><span class=\"text-slate-600\">Se non si sblocca, ricarica la pagina e accedi di nuovo.</span>", productSubtitle: "Unico prodotto attivo ora. Piattaforma: {platform}." }, lectura: { loadError: "Impossibile caricare il libro completo.", active: "Accesso attivo. Ora puoi leggere il contenuto completo.", pending: "Accesso in sospeso. Attiva il tuo acquisto su <a href=\"ventas.html\" class=\"underline\">Acquista</a> per sbloccare questa sezione.", noPrologue: "Prologo non disponibile.", noEpilogue: "Epilogo non disponibile.", prologueError: "Errore nel caricare il prologo: {message}", epilogueError: "Errore nel caricare l'epilogo: {message}" }, epilogo: { noFound: "Epilogo non trovato nel manoscritto.", readError: "Impossibile leggere il manoscritto.", loadError: "Impossibile caricare l'epilogo: {message}" }, login: { sessionActive: "Sessione attiva: {email}.", noSession: "Nessuna sessione attiva.", redirectGoogle: "Reindirizzamento a Google...", googleError: "Errore Google: {message}", fillEmailPassword: "Completa email e password.", loginError: "Impossibile accedere: {message}", loginOk: "Accesso effettuato con email.", registerError: "Impossibile creare l'account: {message}", registerOk: "Account creato. Controlla la tua email per confermare.", logoutOk: "Sessione terminata.", logoutError: "Impossibile terminare la sessione: {message}", fillResetEmail: "Inserisci la tua email per recuperare la password.", resetError: "Impossibile inviare l'email: {message}", resetOk: "Email di recupero inviata. Controlla la tua casella di posta." }, reviews: { none: "Non ci sono ancora recensioni. Sii il primo a commentare.", firebaseConfig: "Recensioni collegate a Supabase.", readError: "Errore nella lettura delle recensioni: {message}", disabledPublic: "Pubblicazione recensioni non abilitata in questa versione pubblica.", connectedAs: "Connesso come {email}. Ora puoi pubblicare recensioni.", mustLogin: "Devi accedere per scrivere recensioni. Vai su <a href=\"login.html\" class=\"underline\">Accedi</a>.", needLoginToPost: "Devi accedere per pubblicare.", completeFields: "Completa nome e commento.", publishOk: "Recensione pubblicata con successo.", publishError: "Impossibile pubblicare la recensione: {message}" } },
  product: { name: "Ombra nello Specchio", description: "Acquisto unico per sbloccare la lettura completa sulla piattaforma.", publicDescription: "Ombra nello Specchio esplora la violenza psicologica e la manipolazione emotiva.", benefits: [{ title: "Libro completo", badge: "Accesso totale", description: "Sblocca la lettura completa sul sito." }, { title: "Formato digitale", badge: "Lettura immediata", description: "Leggi online dopo aver attivato l'acquisto." }, { title: "Base scalabile", badge: "Pronto per il futuro", description: "Catalogo pronto per altri libri e progetti." }], transparency: "I fondi sono destinati a editing, produzione, distribuzione e manutenzione. I pagamenti sono elaborati in modo sicuro." }
};

// Traducciones reales para chino
DICT.zh = {
  langName: "中文",
  common: { menu: "菜单", language: "语言", nav: { home: "首页", synopsis: "简介", fullReading: "完整阅读", epilogue: "结语", reviews: "评论", buy: "购买", login: "登录" }, actions: { buyNow: "立即购买", goToBuy: "前往购买" } },
  pages: { index: { title: "Abel de Ferro | 镜中之影", eyebrow: "心理小说", byline: "作者：Abel de Ferro", tagline: "每一个倒影都隐藏着无形的契约。每一个沉默亦然。", lead: "一个从亲密视角深入探讨心理暴力的故事。", synopsisTitle: "简介", synopsisBody: "镜中之影探讨了情感控制与依赖。", quote: "\"打破镜子的不是一声尖叫，而是习惯了低声细语。\"", authorTitle: "关于Abel de Ferro", authorBody: "Abel de Ferro 探索情感张力叙事。", footer: "© 2026 Abel de Ferro. 镜中之影作者。" }, ventas: { title: "购买 | Abel de Ferro", eyebrow: "官方购买", loadingProduct: "加载产品...", buyBook: "购买书籍", buyBookLead: "目前有一本在售书籍。", transparency: "透明声明", optionalEmbed: "可选嵌入结账", embedHint: "<!-- 在此插入您的 Stripe Checkout 或 Gumroad 代码 -->" }, lectura: { title: "完整阅读 | Abel de Ferro", eyebrow: "受保护内容", heading: "完整阅读", descriptionTitle: "书籍简介", prologueTitle: "序言（公开预览）", epilogueTitle: "结语（公开预览）", lockedTitle: "未启用访问权限", lockedBody: "要解锁完整书籍，请完成购买后返回此处。", fullTextTitle: "完整文本" }, epilogo: { title: "结语 | Abel de Ferro", eyebrow: "作品结尾", heading: "结语", autoLoad: "已自动从主稿加载。", loading: "正在加载结语..." }, reviews: { title: "评论 | Abel de Ferro", heading: "评论系统", intro: "仅认证用户可发布评论。", authChecking: "正在验证身份...", name: "姓名", rating: "评分", comment: "评论", submit: "发布评论", realtimeTitle: "实时评论", realtimeBody: "已连接 Supabase。", star5: "5 星", star4: "4 星", star3: "3 星", star2: "2 星", star1: "1 星" }, login: { title: "登录 | Abel de Ferro", heading: "读者访问", intro: "登录以发布评论并参与社区。", notice: "如无账号，可用邮箱和密码注册。", google: "使用 Google 登录", logout: "退出登录", email: "邮箱", password: "密码", loginEmail: "邮箱登录", createAccount: "创建账号", forgot: "忘记密码？" } },
  dynamic: { buy: { setupCta: "设置支付链接", grantedAccess: "已授予访问权限", activeAccess: "完整书籍访问权限已激活。可从 <a href=\"lectura.html\" class=\"underline\">完整阅读</a> 进入。", pendingAccess: "访问权限尚未激活。请完成购买以解锁 <strong>完整阅读</strong>。", checkoutHint: "<strong>支付完成后：</strong> 访问权限会自动激活，可立即开始阅读。<br><br><span class=\"text-slate-600\">如未解锁，请刷新页面并重新登录。</span>", productSubtitle: "当前唯一在售产品。平台：{platform}." }, lectura: { loadError: "无法加载完整书籍。", active: "访问权限已激活。现在可以阅读全部内容。", pending: "访问待激活。请在 <a href=\"ventas.html\" class=\"underline\">购买</a> 后解锁此部分。", noPrologue: "序言不可用。", noEpilogue: "结语不可用。", prologueError: "加载序言出错：{message}", epilogueError: "加载结语出错：{message}" }, epilogo: { noFound: "主稿中未找到结语。", readError: "无法读取主稿。", loadError: "无法加载结语：{message}" }, login: { sessionActive: "已登录：{email}。", noSession: "无活跃会话。", redirectGoogle: "正在跳转到 Google...", googleError: "Google 错误：{message}", fillEmailPassword: "请填写邮箱和密码。", loginError: "无法登录：{message}", loginOk: "已通过邮箱登录。", registerError: "无法创建账号：{message}", registerOk: "账号已创建。请查收邮箱确认。", logoutOk: "已退出登录。", logoutError: "无法退出登录：{message}", fillResetEmail: "请输入邮箱以找回密码。", resetError: "无法发送邮件：{message}", resetOk: "已发送找回邮件。请查收收件箱。" }, reviews: { none: "暂无评论。欢迎首评。", firebaseConfig: "评论已连接 Supabase。", readError: "读取评论出错：{message}", disabledPublic: "本公开版本未启用评论发布。", connectedAs: "已登录为 {email}。现在可以发布评论。", mustLogin: "需登录后才能评论。前往 <a href=\"login.html\" class=\"underline\">登录</a>。", needLoginToPost: "需登录后才能发布。", completeFields: "请填写姓名和评论。", publishOk: "评论发布成功。", publishError: "无法发布评论：{message}" } },
  product: { name: "镜中之影", description: "一次性购买即可在平台解锁完整阅读。", publicDescription: "镜中之影探讨了心理暴力和情感操控。", benefits: [{ title: "完整书籍", badge: "全部访问", description: "在网站上解锁完整阅读。" }, { title: "数字格式", badge: "即时阅读", description: "购买激活后即可在线阅读。" }, { title: "可扩展基础", badge: "面向未来", description: "目录已准备好添加更多书籍和项目。" }], transparency: "资金用于编辑、制作、发行和维护。支付过程安全加密。" }
};

function replaceVars(template, vars) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => (vars[key] ?? ""));
}

function pathGet(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined), obj);
}

export function normalizeLang(input) {
  const base = String(input || "").toLowerCase().split("-")[0];
  return SUPPORTED_LANGS.includes(base) ? base : "es";
}

export function getCurrentLang() {
  const url = new URL(window.location.href);
  const rawParam = (url.searchParams.get(PARAM_KEY) || "").toLowerCase().split("-")[0];
  if (SUPPORTED_LANGS.includes(rawParam)) {
    return rawParam;
  }

  const rawStorage = (localStorage.getItem(STORAGE_KEY) || "").toLowerCase().split("-")[0];
  if (SUPPORTED_LANGS.includes(rawStorage)) {
    return rawStorage;
  }

  return normalizeLang(navigator.language);
}

export function setCurrentLang(lang) {
  const next = normalizeLang(lang);
  localStorage.setItem(STORAGE_KEY, next);

  const url = new URL(window.location.href);
  url.searchParams.set(PARAM_KEY, next);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  document.documentElement.lang = next;
  return next;
}

export function t(path, vars = {}, lang = getCurrentLang()) {
  const active = DICT[normalizeLang(lang)] || DICT.es;
  const fallback = DICT.es;
  const template = pathGet(active, path) ?? pathGet(fallback, path) ?? path;
  return replaceVars(template, vars);
}

export function getProductI18n(lang = getCurrentLang()) {
  const active = DICT[normalizeLang(lang)] || DICT.es;
  return active.product || DICT.es.product;
}

function localizeNavLinks(lang) {
  const links = document.querySelectorAll("a[href]");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) {
      return;
    }

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
      return;
    }

    url.searchParams.set(PARAM_KEY, lang);
    link.setAttribute("href", `${url.pathname.split("/").pop()}${url.search}${url.hash}`);
  });
}

function upsertLanguageSelectors(lang) {
  const nav = document.querySelector("header nav");
  if (!nav || document.getElementById("langSelector")) {
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "ml-2 flex items-center gap-2";

  const label = document.createElement("label");
  label.setAttribute("for", "langSelector");
  label.className = "text-xs font-semibold text-slate-600";
  label.textContent = t("common.language", {}, lang);

  const select = document.createElement("select");
  select.id = "langSelector";
  select.className = "lang-select";
  SUPPORTED_LANGS.forEach((code) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = (DICT[code] || DICT.en).langName || code;
    select.appendChild(option);
  });
  select.value = lang;
  select.addEventListener("change", () => {
    const next = setCurrentLang(select.value);
    applyTranslations(next);
  });

  wrap.append(label, select);
  nav.appendChild(wrap);
}

export function applyTranslations(lang = getCurrentLang()) {
  const active = setCurrentLang(lang);

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    const text = t(key, {}, active);
    if (node.hasAttribute("data-i18n-html")) {
      node.innerHTML = text;
    } else {
      node.textContent = text;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.getAttribute("data-i18n-placeholder");
    node.setAttribute("placeholder", t(key, {}, active));
  });

  const page = document.body?.dataset?.page;
  if (page) {
    document.title = t(`pages.${page}.title`, {}, active);
  }

  const selectorLabel = document.querySelector("label[for='langSelector']");
  if (selectorLabel) {
    selectorLabel.textContent = t("common.language", {}, active);
  }

  localizeNavLinks(active);

  const selector = document.getElementById("langSelector");
  if (selector) {
    selector.value = active;
  }

  window.dispatchEvent(new CustomEvent("af:languageChanged", { detail: { lang: active } }));
}

export function initI18n() {
  const lang = getCurrentLang();
  upsertLanguageSelectors(lang);
  applyTranslations(lang);
  return lang;
}
