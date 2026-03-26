exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { toEmail, replyTo, subject, text, pdfFilename, pdfBase64, serviceId, templateId, publicKey } = body;

    if (!toEmail || !subject || !text || !pdfFilename || !pdfBase64 || !serviceId || !templateId || !publicKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Faltan datos obligatorios para enviar el pedido" }),
      };
    }

    const emailjsResp = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: toEmail,
          reply_to: replyTo || toEmail,
          name: "Pedido Web",
          title: subject,
          message: text,
          pdf_filename: pdfFilename,
          pdf_base64: pdfBase64,
          attachments: [{ name: pdfFilename, data: pdfBase64 }],
        },
      }),
    });

    const raw = await emailjsResp.text();
    if (!emailjsResp.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: raw || "EmailJS rechazo el envio" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, provider: "emailjs", response: raw || "ok" }) };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error?.message || "Error interno en funcion de correo" }),
    };
  }
};
