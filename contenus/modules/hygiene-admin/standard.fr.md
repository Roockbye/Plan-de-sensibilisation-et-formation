## Pourquoi les administrateurs sont la cible n° 1

Dans la plupart des attaques par rançongiciel, l'attaquant cherche d'abord à **obtenir un compte à privilèges**. Une fois administrateur du domaine, il désactive les protections, supprime les sauvegardes et chiffre l'ensemble du SI. Votre compte vaut donc plus que tous les autres réunis.

## Comptes dédiés et moindre privilège

- **Un compte d'administration n'est jamais utilisé** pour naviguer sur le web ni lire ses e-mails. Utilisez un compte bureautique standard au quotidien et un compte d'administration distinct, idéalement depuis un **poste d'administration dédié**.
- **Moindre privilège** : chaque compte (humain ou de service) n'a que les droits strictement nécessaires, le temps nécessaire.
- **Revue des droits** régulière : départs, changements de poste, comptes de prestataires, comptes de service oubliés.
- **Authentification forte** obligatoire sur tous les accès d'administration et tous les accès distants.
- Pas de mot de passe partagé ni stocké en clair (scripts, wikis, tickets) : utilisez le coffre-fort de secrets de l'organisation.

## Correctifs et exposition

- Tenez un **inventaire** à jour : on ne protège pas ce qu'on ne connaît pas (dont l'informatique fantôme).
- Priorisez les correctifs selon : **exposition sur Internet**, **exploitation active** connue, criticité de l'actif. Une vulnérabilité activement exploitée sur un équipement exposé (VPN, pare-feu, messagerie) se corrige en **heures**, pas en semaines.
- Suivez les alertes du CERT-FR et des éditeurs.

## Journaliser et détecter

- Centralisez les journaux (authentifications, créations de comptes, modifications de groupes privilégiés) et protégez-les contre la modification.
- Signaux faibles à surveiller : connexion d'un compte à privilèges à une heure ou depuis un poste inhabituels, ajout à un groupe d'administration, désactivation de l'antivirus, suppression de sauvegardes.
- Sauvegardes : au moins une copie **hors ligne** ou immuable, avec des **tests de restauration** réguliers.

> **À retenir** : compte d'admin séparé et jamais pour le web ou les e-mails, droits minimaux et revus, correctifs priorisés par l'exposition, journaux centralisés, sauvegardes hors ligne testées.

## L'ingénierie sociale contre le support

Des attaques majeures ont commencé par un simple appel au support : un attaquant se fait passer pour un salarié (voire un dirigeant) et obtient la **réinitialisation de son mot de passe ou de sa double authentification**.

- Appliquez une **procédure de vérification d'identité** stricte, sans exception pour l'urgence ou le rang hiérarchique.
- **Rappelez** le demandeur sur son numéro connu de l'annuaire, ou exigez une validation par son manager.
- Tracez chaque réinitialisation dans un ticket.

Tout soupçon de compromission se signale immédiatement à {{contacts.securite}} ({{contacts.telephoneUrgence}}).
