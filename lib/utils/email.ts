import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function sendRoomInvitationEmail(
  email: string,
  roomName: string,
  roomLink: string,
  creatorName: string
) {
  if (!resend) {
    console.log(`[Email Mock] Invitation to ${email} for "${roomName}" (${roomLink})`)
    return { success: true, mocked: true }
  }

  try {
    await resend.emails.send({
      from: 'Openly <noreply@openly.app>',
      to: email,
      subject: `You're invited to share in "${roomName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FAF8F5;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2D2D2D; font-size: 24px; margin: 0;">openly</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2D2D2D; margin-top: 0;">You're invited to share your thoughts</h2>
            <p style="color: #6B6B6B; line-height: 1.6;">
              ${creatorName} has invited you to participate in an anonymous feedback room called <strong>"${roomName}"</strong>.
            </p>
            <p style="color: #6B6B6B; line-height: 1.6;">
              Your responses are completely anonymous. This is a space for honest feedback without fear of judgment.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${roomLink}" style="display: inline-block; background-color: #2D2D2D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Enter Room
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 30px;">
              This link will expire when the room closes.
            </p>
          </div>
          <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 30px;">
            © Openly · Say what you really mean
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to send email:', error)
    return { success: false, error: error.message }
  }
}

export async function sendThreadReplyEmail(
  creatorEmail: string,
  roomName: string,
  threadMessage: string,
  roomLink: string
) {
  if (!resend) {
    console.log(`[Email Mock] Thread reply to ${creatorEmail} for "${roomName}": ${threadMessage}`)
    return { success: true, mocked: true }
  }

  try {
    await resend.emails.send({
      from: 'Openly <noreply@openly.app>',
      to: creatorEmail,
      subject: `New reply in "${roomName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FAF8F5;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2D2D2D; font-size: 24px; margin: 0;">openly</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #2D2D2D; margin-top: 0;">New reply to your thread</h2>
            <p style="color: #6B6B6B; line-height: 1.6;">
              Someone has replied to a thread in <strong>"${roomName}"</strong>.
            </p>
            <div style="background-color: #FAF8F5; padding: 15px; border-radius: 6px; margin: 20px 0; font-style: italic; color: #2D2D2D;">
              "${threadMessage}"
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${roomLink}" style="display: inline-block; background-color: #2D2D2D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Reply
              </a>
            </div>
          </div>
          <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 30px;">
            © Openly · Say what you really mean
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error: any) {
    console.error('Failed to send email:', error)
    return { success: false, error: error.message }
  }
}
