/**
 * Auth0 Post-Login Action
 *
 * Deploy this at: Auth0 Dashboard → Actions → Library → Create Action
 * Trigger: Login / Post Login
 * Name: "Add email and metadata to tokens"
 *
 * After creating, go to Auth0 → Actions → Flows → Login
 * and drag this action into the flow between "Start" and "Complete".
 */

exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://zungo.app'

  // Add email as a custom claim in the access token
  // (Auth0 doesn't include email in access tokens by default)
  if (event.user.email) {
    api.accessToken.setCustomClaim(`${namespace}/email`, event.user.email)
    api.idToken.setCustomClaim(`${namespace}/email`, event.user.email)
  }

  // Add user name
  if (event.user.name) {
    api.accessToken.setCustomClaim(`${namespace}/name`, event.user.name)
  }
}
