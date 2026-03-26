const GRAY_200 = "#e8e7e4"
const GRAY_700 = "#44433f"
const GRAY_900 = "#1c1c1a"

export default function MentionsLegalesPage() {
  const sectionStyle = { marginBottom: 28 }
  const h2Style = { fontSize: 18, fontWeight: 700, color: GRAY_900, margin: "0 0 8px" }
  const pStyle = { fontSize: 14, color: GRAY_700, lineHeight: 1.7, margin: "0 0 12px" }

  return (
    <div>
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 32px", letterSpacing: "-0.02em", color: GRAY_900 }}>
        Mentions légales
      </h1>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Éditeur du site</h2>
        <p style={pStyle}>
          Le site monpermis.vercel.app est édité par :<br />
          Baptiste — Entrepreneur individuel<br />
          Siège : Vendée (85), France<br />
          Email : contact@permisclair.fr<br />
          Directeur de la publication : Baptiste
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Hébergement</h2>
        <p style={pStyle}>
          Le site est hébergé par :<br />
          Vercel Inc.<br />
          440 N Barranca Ave #4133<br />
          Covina, CA 91723, États-Unis<br />
          Site : vercel.com
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Propriété intellectuelle</h2>
        <p style={pStyle}>
          L'ensemble du contenu du site (textes, images, graphismes, logo, structure) est la propriété exclusive de PermisClair, sauf mention contraire. Toute reproduction, même partielle, est interdite sans autorisation préalable.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Données personnelles</h2>
        <p style={pStyle}>
          Les informations recueillies via le formulaire de projet sont destinées exclusivement à la réalisation de la prestation commandée. Elles ne sont ni vendues, ni cédées à des tiers. Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez : contact@permisclair.fr.
        </p>
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${GRAY_200}`, margin: "40px 0" }} />

      <h1 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 32px", letterSpacing: "-0.02em", color: GRAY_900 }}>
        Conditions générales de vente
      </h1>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 1 — Objet</h2>
        <p style={pStyle}>
          Les présentes conditions régissent les relations entre PermisClair (ci-après "le Prestataire") et toute personne physique passant commande sur le site (ci-après "le Client"). Le Prestataire propose un service de réalisation de plans et de constitution de dossiers de permis de construire ou de déclaration préalable de travaux.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 2 — Prestations</h2>
        <p style={pStyle}>
          La prestation comprend, selon la formule choisie : la réalisation des plans nécessaires au dépôt du dossier (plan de situation, plan de masse, plan en coupe, plans de façades, insertion paysagère), la rédaction de la notice descriptive, le remplissage du formulaire CERFA, et l'assemblage du dossier complet au format PDF. Le Client conserve la responsabilité du dépôt du dossier auprès de sa mairie.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 3 — Tarifs et paiement</h2>
        <p style={pStyle}>
          Les tarifs sont indiqués en euros TTC sur le site. Le prix est déterminé en fonction du type de projet et confirmé au Client avant tout paiement. Le paiement est exigible en totalité au moment de la commande. Le paiement est sécurisé par Stripe.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 4 — Délais de livraison</h2>
        <p style={pStyle}>
          Le dossier complet est livré par voie électronique (email ou espace client) dans un délai moyen de 5 jours ouvrés après réception de l'ensemble des informations et documents nécessaires fournis par le Client. Ce délai est indicatif et peut varier selon la complexité du projet.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 5 — Garantie acceptation</h2>
        <p style={pStyle}>
          En cas de demande de pièces complémentaires ou de refus motivé par la mairie, le Prestataire s'engage à réaliser les corrections nécessaires et à fournir un dossier mis à jour, sans frais supplémentaires pour le Client. Cette garantie s'applique uniquement aux motifs de refus liés à la qualité ou la conformité du dossier produit par le Prestataire.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 6 — Droit de rétractation</h2>
        <p style={pStyle}>
          Conformément à l'article L.221-18 du Code de la consommation, le Client dispose d'un délai de 14 jours à compter de la date de commande pour exercer son droit de rétractation, sans avoir à justifier de motif. Si la prestation a déjà été commencée avec l'accord du Client avant l'expiration de ce délai, le montant correspondant au travail déjà effectué pourra être retenu. Pour exercer ce droit, le Client envoie sa demande à : contact@permisclair.fr.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 7 — Responsabilité</h2>
        <p style={pStyle}>
          Le Prestataire s'engage à réaliser les plans et le dossier avec soin et professionnalisme. Le Prestataire ne se substitue pas à un architecte et ne fournit pas de calculs structurels, d'études thermiques réglementaires ni de validation juridique. Pour les constructions dont la surface de plancher dépasse 150 m², le recours à un architecte est obligatoire conformément à la loi.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 8 — Litiges</h2>
        <p style={pStyle}>
          En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, le litige sera soumis aux tribunaux compétents du ressort du domicile du Prestataire. Le Client peut également recourir à un médiateur de la consommation.
        </p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>Article 9 — Contact</h2>
        <p style={pStyle}>
          Pour toute question relative aux présentes conditions : contact@permisclair.fr.
        </p>
      </div>
    </div>
  )
}
