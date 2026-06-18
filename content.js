const MASTER_KEY = "cryptclip-demo-key";

async function deriveKey(password){

    const tStart = performance.now();
    const enc = new TextEncoder();

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name:"PBKDF2" },
        false,
        ["deriveKey"]
    );

    const derivedKey = await crypto.subtle.deriveKey(
        {
            name:"PBKDF2",
            salt:enc.encode("cryptclip-salt"),
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

function setNativeValue(element,value){

    const valueSetter =
        Object.getOwnPropertyDescriptor(
            element.__proto__,
            "value"
        )?.set;

    const prototype = Object.getPrototypeOf(element);

    const prototypeValueSetter =
        Object.getOwnPropertyDescriptor(
            prototype,
            "value"
        )?.set;

    if(prototypeValueSetter){
        prototypeValueSetter.call(element,value);
    }else if(valueSetter){
        valueSetter.call(element,value);
    }else{
        element.value = value;
    }

    element.dispatchEvent(
        new Event("input",{ bubbles:true })
    );

    element.dispatchEvent(
        new Event("change",{ bubbles:true })
    );
}

document.addEventListener("paste", async (e)=>{

    try{

        const pasted = e.clipboardData.getData("text");

        if(!pasted.startsWith("CRYPTCLIP::")){
            return;
        }

        const tPasteStart = performance.now();
        e.preventDefault();

        const plaintext = await decryptText(
            pasted,
            MASTER_KEY
        );

        const target = e.target;

        if(
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement
        ){

            const start = target.selectionStart || 0;
            const end = target.selectionEnd || 0;

            const current = target.value || "";

            const newValue =
                current.slice(0,start) +
                plaintext +
                current.slice(end);

            setNativeValue(target,newValue);

            const tPasteEnd = performance.now();
            console.log(`Paste Event to Plaintext Injection: ${(tPasteEnd - tPasteStart).toFixed(2)} ms`);
            return;
        }

        if(target.isContentEditable){

            document.execCommand(
                "insertText",
                false,
                plaintext
            );
            const tPasteEnd = performance.now();
            console.log(`Paste Event to Plaintext Injection: ${(tPasteEnd - tPasteStart).toFixed(2)} ms`);
        }

    }catch(err){

        console.error("CryptClip decrypt failed:",err);
    }

},true);
