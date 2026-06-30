export const sendMockEmail = (to: string[], subject: string, body: string) => {
  console.log('--- ENVIANDO E-MAIL AUTOMATIZADO (MOCK) ---');
  console.log(`Para: ${to.join(', ')}`);
  console.log(`Assunto: ${subject}`);
  console.log(`Mensagem:`);
  console.log(body);
  console.log('-------------------------------------------');
  // Aqui poderia integrar com Resend, SendGrid, etc.
};
