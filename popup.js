const MASTER_KEY = "cryptclip-demo-key";

async function deriveKey(password){

    const tStart = performance.now();
    const enc = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name:"PBKDF2",
            salt: enc.encode("cryptclip-salt"),
            iterations:100000,
            hash:"SHA-256"
        },
        keyMaterial,
        {
            name:"AES-GCM",
            length:256
        },
        false,
        ["encrypt","decrypt"]
    );
    const tEnd = performance.now();
    console.log(`PBKDF2 Key Derivation (100k iter): ${(tEnd - tStart).toFixed(2)} ms`);
    return derivedKey;
}

async function encryptText(text,password){

    const key = await deriveKey(password);

    const tEncryptStart = performance.now();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        {
            name:"AES-GCM",
            iv
        },
        key,
        new TextEncoder().encode(text)
    );
    const tEncryptEnd = performance.now();
    console.log(`AES-256-GCM Encrypt (${text.length} bytes): ${(tEncryptEnd - tEncryptStart).toFixed(2)} ms`);

    const tBase64Start = performance.now();
    const payload = {
        iv:Array.from(iv),
        data:Array.from(new Uint8Array(encrypted))
    };

    const encoded = "CRYPTCLIP::" + btoa(JSON.stringify(payload));
    const tBase64End = performance.now();
    console.log(`Base64 Encode/Decode (Encode): ${(tBase64End - tBase64Start).toFixed(2)} ms`);

    return encoded;
}

async function decryptText(payload,password){

    const clean = payload.replace("CRYPTCLIP::","");

    const tBase64Start = performance.now();
    const decodedPayload = atob(clean);
    const parsed = JSON.parse(decodedPayload);
    const tBase64End = performance.now();
    console.log(`Base64 Encode/Decode (Decode): ${(tBase64End - tBase64Start).toFixed(2)} ms`);

    const key = await deriveKey(password);

    const tDecryptStart = performance.now();
    const decrypted = await crypto.subtle.decrypt(
        {
            name:"AES-GCM",
            iv:new Uint8Array(parsed.iv)
        },
        key,
        new Uint8Array(parsed.data)
    );

    const decryptedText = new TextDecoder().decode(decrypted);
    const tDecryptEnd = performance.now();
    console.log(`AES-256-GCM Decrypt (${decryptedText.length} bytes): ${(tDecryptEnd - tDecryptStart).toFixed(2)} ms`);

    return decryptedText;
}

// Escapes special HTML characters to prevent XSS/rendering issues
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

// Custom Toast notification helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
        iconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span style="flex-grow: 1;">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

async function loadItems(){

    const result = await chrome.storage.local.get(["items"]);

    const items = result.items || [];

    const container = document.getElementById("items");

    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </span>
                <div class="empty-text">No secrets stored yet. Add one above.</div>
            </div>
        `;
        return;
    }

    items.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "item-card";

        div.innerHTML = `
            <div class="item-header">
                <span class="item-label" title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span>
            </div>
            <!-- The preview div remains empty until real-time decryption is requested by clicking Reveal -->
            <div class="item-preview" id="preview-${index}"></div>
            <div class="item-actions">
                <button class="btn-action-text copyBtn" data-index="${index}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy Encrypted
                </button>
                <button class="btn-icon toggleBtn" data-index="${index}" title="Reveal secret">
                    <svg class="eye-open" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg class="eye-closed" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                </button>
                <button class="btn-icon btn-icon-danger deleteBtn" data-index="${index}" title="Delete secret">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;

        container.appendChild(div);
    });

    document.querySelectorAll(".copyBtn").forEach(btn=>{

        btn.addEventListener("click", async ()=>{

            try {
                const item = items[btn.dataset.index];

                // Item is already encrypted in local storage, we copy directly to clipboard
                await navigator.clipboard.writeText(item.secret);
                showToast("Ciphertext copied to clipboard!");
            } catch (err) {
                console.error("Clipboard copy failed", err);
                showToast("Failed to copy encrypted text.", "error");
            }
        });
    });

    document.querySelectorAll(".toggleBtn").forEach(btn=>{

        btn.addEventListener("click", async ()=>{
            const index = btn.dataset.index;
            const item = items[index];
            const previewDiv = document.getElementById(`preview-${index}`);
            const eyeOpen = btn.querySelector(".eye-open");
            const eyeClosed = btn.querySelector(".eye-closed");

            if (previewDiv.classList.contains("visible")) {
                previewDiv.classList.remove("visible");
                previewDiv.textContent = ""; // Clear plaintext from memory and DOM
                eyeOpen.style.display = "block";
                eyeClosed.style.display = "none";
                btn.title = "Reveal secret";
            } else {
                try {
                    // Decrypt the stored secret in real-time
                    const decrypted = await decryptText(item.secret, MASTER_KEY);
                    previewDiv.textContent = decrypted;
                    previewDiv.classList.add("visible");
                    eyeOpen.style.display = "none";
                    eyeClosed.style.display = "block";
                    btn.title = "Hide secret";
                } catch (err) {
                    console.error("Decryption failed", err);
                    showToast("Failed to decrypt secret.", "error");
                }
            }
        });
    });

    document.querySelectorAll(".deleteBtn").forEach(btn=>{

        btn.addEventListener("click", async ()=>{
            const index = parseInt(btn.dataset.index, 10);
            
            const res = await chrome.storage.local.get(["items"]);
            const currentItems = res.items || [];
            
            currentItems.splice(index, 1);
            
            await chrome.storage.local.set({
                items: currentItems
            });

            showToast("Secret deleted successfully.", "info");
            loadItems();
        });
    });
}

document.getElementById("saveBtn").addEventListener("click", async ()=>{

    const labelInput = document.getElementById("label");
    const secretInput = document.getElementById("secret");

    const label = labelInput.value.trim();
    const secret = secretInput.value;

    if(!label || !secret){
        showToast("Please fill all fields.", "error");
        return;
    }

    try {
        // Encrypt the secret BEFORE storing it in local storage
        const encryptedSecret = await encryptText(secret, MASTER_KEY);

        const result = await chrome.storage.local.get(["items"]);
        const items = result.items || [];

        items.push({
            label,
            secret: encryptedSecret
        });

        await chrome.storage.local.set({
            items
        });

        labelInput.value = "";
        secretInput.value = "";

        showToast("Secret saved and encrypted!");
        loadItems();
    } catch (err) {
        console.error("Encryption and save failed", err);
        showToast("Failed to encrypt and save secret.", "error");
    }
});

loadItems();
