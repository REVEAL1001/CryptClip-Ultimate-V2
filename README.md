# CryptClip Ultimate v2

CryptClip Ultimate v2 is a Chrome extension that securely stores sensitive information such as passwords, API keys, login credentials, recovery codes, and other secrets. Data is encrypted before being copied to the clipboard and automatically decrypted when pasted into supported form fields.

## Installation

### Method 1: Install from Source

1. Download or clone this repository.

```bash
git clone https://github.com/REVEAL1001/CryptClip-Ultimate-V2.git
```

2. Open Google Chrome and navigate to:

```text
chrome://extensions
```

3. Enable **Developer Mode** using the toggle in the top-right corner.

4. Click **Load Unpacked**.

5. Select the `CryptClip-Ultimate-V2` project folder.

6. The CryptClip extension should now appear in your installed extensions list.

## Usage

### Saving a Secret

1. Click the CryptClip extension icon.
2. Enter the secret value you want to protect.
3. Save the secret.
4. The value is encrypted and stored securely by the extension.

### Copying an Encrypted Secret

1. Open the CryptClip extension popup.
2. Select the stored secret.
3. Click **Copy**.
4. The clipboard receives only the encrypted ciphertext.

Example clipboard content:

```text
CRYPTCLIP::eyJpdiI6W10sImRhdGEiOltdfQ==
```

### Pasting Into Login Forms

1. Navigate to any supported website or application.
2. Click inside a username, password, or text field.
3. Press **Ctrl + V** (or **Cmd + V** on macOS).
4. CryptClip automatically detects the encrypted payload.
5. The ciphertext is decrypted locally in the browser.
6. The original plaintext is inserted into the form field.

### Supported Input Types

* Text inputs
* Password inputs
* Textareas
* Login forms
* Registration forms
* React-controlled inputs
* Framework-managed inputs
* Content-editable elements

## Example Workflow

1. Store password: `MySecurePassword123`
2. Copy from CryptClip.
3. Clipboard contains encrypted ciphertext only.
4. Open a login page.
5. Paste into the password field.
6. CryptClip automatically decrypts and inserts `MySecurePassword123`.

At no point is the plaintext password placed directly onto the clipboard.

## Security Notes

* Clipboard data remains encrypted.
* AES-256-GCM is used for encryption and decryption.
* PBKDF2 with SHA-256 is used for key derivation.
* Decryption occurs locally within the browser.
* No secrets are transmitted to external servers.
* No cloud storage or third-party services are required.

## Requirements

* Google Chrome (Manifest V3 compatible)
* Chromium-based browsers such as:

  * Google Chrome
  * Microsoft Edge
  * Brave
  * Opera

## Disclaimer

CryptClip Ultimate v2 is intended for educational, research, and personal security use. Users should independently evaluate whether the extension meets their security requirements before storing highly sensitive information.
