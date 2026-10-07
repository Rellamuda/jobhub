describe('Job Hub AI Core Journey', () => {
  it('Should successfully navigate to AI Job Description and Pricing', () => {
    // Navigate to homepage
    cy.visit('http://localhost:3000');
    cy.contains('JobHub AI').should('be.visible');

    // Go to pricing
    cy.visit('http://localhost:3000/dashboard/pricing');
    cy.contains('AI Pro').should('be.visible');
    
    // Check Paystack integration hooks
    cy.contains('Subscribe to Premium').should('be.visible');
    
    // Go to AI Job Gen
    cy.visit('http://localhost:3000/dashboard/employer/job-description');
    cy.contains('Generate Job Description').should('be.visible');
  });
});
