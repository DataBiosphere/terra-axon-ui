import { TestProfile } from "../../src/testing/profile";
import "./commands";

before(() => {
  if (Cypress.env("USE_FAKE")) {
    // In dev mode, the fake automatically restarts on code changes (along with the tests).
    // This ensures the APIs are available again before we try to make requests.
    let count = 0;
    const retry = () => {
      cy.task("fakeHealthCheck").then((healthy) => {
        if (healthy) return;
        count++;
        expect(count, "Timeout waiting for fake").to.not.equal(10);
        cy.wait(1000).then(() => retry());
      });
    };
    retry();

    cy.apis().then(({ usersApi }) =>
      usersApi.inviteUser({ inviteeEmail: TestProfile.email })
    );
  }
});
