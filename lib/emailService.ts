import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSubscriptionConfirmationEmail(
  email: string,
  name: string,
  plan: string,
) {
  try {
    const emailContent = generateSubscriptionConfirmationEmail(name, plan);

    const { data, error } = await resend.emails.send({
      from: "Larry AI <noreply@larry-ai.com>",
      to: [email],
      subject: "Welcome to Larry AI Premium! 🎉",
      html: emailContent,
    });

    if (error) {
      console.error("Error sending subscription confirmation email:", error);
      return { success: false, error };
    }

    console.log("Subscription confirmation email sent:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Failed to send subscription confirmation email:", error);
    return { success: false, error };
  }
}

function generateSubscriptionConfirmationEmail(
  name: string,
  plan: string,
): string {
  const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(name)}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Larry AI Premium!</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e293b; font-size: 28px; margin-bottom: 10px;">🎉 Welcome to Larry AI Premium!</h1>
        <p style="color: #64748b; font-size: 16px;">Hi ${name}, your premium subscription is now active!</p>
      </div>
      
      <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
        <h2 style="color: #1e293b; margin-top: 0;">Your Premium Benefits</h2>
        <p style="color: #64748b; margin-bottom: 20px;">Here's what you now have access to with your ${plan} subscription:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
          <h3 style="color: #1e293b; margin-top: 0;">🚀 Unlimited AI Conversations</h3>
          <ul style="color: #64748b; padding-left: 20px; margin: 0;">
            <li>Unlimited chat messages with Larry AI</li>
            <li>Advanced AI capabilities and responses</li>
            <li>Priority processing for faster responses</li>
            <li>Access to premium AI models</li>
          </ul>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 20px;">
          <h3 style="color: #1e293b; margin-top: 0;">💬 Enhanced Chat Features</h3>
          <ul style="color: #64748b; padding-left: 20px; margin: 0;">
            <li>Save and organize your conversations</li>
            <li>Export chat history</li>
            <li>Advanced search through your chats</li>
            <li>Custom chat themes and preferences</li>
          </ul>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin-bottom: 20px;">
          <h3 style="color: #1e293b; margin-top: 0;">🎯 Premium Support</h3>
          <ul style="color: #64748b; padding-left: 20px; margin: 0;">
            <li>Priority customer support</li>
            <li>Direct access to our development team</li>
            <li>Feature requests and feedback priority</li>
            <li>Early access to new features</li>
          </ul>
        </div>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/chat" 
           style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          Start Chatting with Larry AI
        </a>
      </div>

      <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="color: #1e293b; margin-top: 0;">💡 Getting Started Tips</h3>
        <ul style="color: #64748b; padding-left: 20px;">
          <li>Try asking Larry AI complex questions to see the difference</li>
          <li>Explore different conversation topics and use cases</li>
          <li>Save important conversations for future reference</li>
          <li>Check out our help center for advanced features</li>
        </ul>
      </div>

      <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
        <h3 style="color: #92400e; margin-top: 0;">📧 Need Help?</h3>
        <p style="color: #92400e; margin: 0;">
          If you have any questions about your premium subscription or need assistance, 
          don't hesitate to reach out to our support team at 
          <a href="mailto:support@larry-ai.com" style="color: #92400e;">support@larry-ai.com</a>
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px; text-align: center; color: #64748b; font-size: 14px;">
        <p style="margin-top: 15px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #000000; text-decoration: none;">Larry AI</a> - Your AI Assistant
        </p>
        <p style="margin-top: 10px; font-size: 12px;">
          <a href="${unsubscribeLink}" style="color: #64748b; text-decoration: underline;">Unsubscribe from these emails</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

