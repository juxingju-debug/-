

import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { BackgroundOption, StyleOption, GenerationMode, GenerationParams, ButtonMaterialOption, FrameShapeStrategy } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

export const generateBackgroundForProduct = async (imageFile: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = "Analyze this product image. Based on the product, describe a suitable background scene. The description must be in Chinese and no more than 50 characters. Only output the background description text, nothing else.";

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
    });

    const themeText = response.text.trim();
    if (!themeText) {
        throw new Error("AI failed to generate a theme.");
    }
    return themeText;
};

export const generatePropsForProduct = async (imageFile: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = "Analyze this product image. Based on the product, suggest a list of suitable props to place in the scene. Output a comma-separated list of items. The description must be in Chinese and the total length should not exceed 50 characters. Only output the list of props, nothing else.";

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
    });

    const propsText = response.text.trim();
    if (!propsText) {
        throw new Error("AI failed to generate props.");
    }
    return propsText;
};

export const generatePropsForTheme = async (theme: string): Promise<string> => {
    const prompt = `Based on the e-commerce theme "${theme}", suggest a list of suitable props to place in the scene. Output a comma-separated list of items. The list must be in Chinese and the total length should not exceed 50 characters. Only output the list of props, nothing else.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: prompt }] },
    });

    const propsText = response.text.trim();
    if (!propsText) {
        throw new Error("AI failed to generate props for the theme.");
    }
    return propsText;
};

export const generateElementsForTheme = async (theme: string): Promise<string> => {
    const prompt = `Based on the e-commerce frame theme "${theme}", suggest a list of suitable decorative elements, patterns, or motifs. Output a comma-separated list of items. The list must be in Chinese and the total length should not exceed 50 characters. Only output the list of elements, nothing else.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: prompt }] },
    });

    const elementsText = response.text.trim();
    if (!elementsText) {
        throw new Error("AI failed to generate elements for the theme.");
    }
    return elementsText;
};

// Optimized Font Expansion: Improved aesthetic analysis for fonts
export const expandThemePrompt = async (theme: string, mode: GenerationMode): Promise<string> => {
    let prompt: string;

    if (mode === GenerationMode.FONT) {
        prompt = `You are a world-class Typography Designer. 
        Analyze the theme: '${theme}' and expand it into a detailed English design brief.
        
        CRITICAL OUTPUT REQUIREMENTS (Output English text only):
        1. **Font Topology:** Recommend the specific font family best suited for this theme (e.g., 'Chunky Rounded Bubble', 'Sharp Aggressive Gothic', 'Elegant Calligraphy Script', 'Distressed Grunge Serif').
        2. **Material & Texture:** Describe the surface material of the letters (e.g., 'liquid gold', 'fluffy fur', 'transparent ice', 'matte plastic').
        3. **Decorative Elements:** List exactly 6-7 specific, small decorative items associated with the theme (e.g., 'tiny snowflakes', 'gold coins', 'green leaves', 'sparkles').
        4. **Lighting & VFX:** Describe the lighting hitting the text and any glowing/particle effects. Do NOT describe the background environment.
        
        CRITICAL CONSTRAINT: Do NOT describe any background scenery, landscape, room, or context. The text must be isolated in a void or studio setting.
        
        Keep it concise but visually descriptive.`;
    } else if (mode === GenerationMode.ELEMENT) {
        prompt = `你是一位想象力丰富的概念艺术家。你的任务是根据一个抽象主题，联想并提炼出一个具体、单一、具有代表性的“核心元素”。描述必须是中文，精炼且富有创意，不超过50个汉字。只输出描述文字。\n\n主题：'${theme}'`;
    } else if (mode === GenerationMode.FRAME) {
         prompt = `你是一位顶级的电商设计师。将主题概念扩展成关于画框图案、纹理、材质的具体描述。描述必须是中文，不超过50个汉字。只输出描述文字。\n\n主题：'${theme}'`;
    } else {
        prompt = `你是一位场景概念设计师。将主题扩展成关于场景环境、光线、氛围的描述。描述必须是中文，不超过50个汉字。只输出描述文字。\n\n主题：'${theme}'`;
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: prompt }] },
    });

    const expandedTheme = response.text.trim();
    if (!expandedTheme) {
        throw new Error("AI未能优化主题。");
    }
    return expandedTheme;
};

// NEW: Analyze the visual style of a reference image to extract typographic attributes
export const analyzeFontStyleFromImage = async (imageFile: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = `Analyze the typography and visual style in this image. 
    Provide a detailed technical description of:
    1. **Font Anatomy:** (e.g., thin serifs, bold slab, rounded terminals, script handwriting, brush strokes).
    2. **Texture & Material:** (e.g., glossy plastic, brushed metal, glowing neon, soft matte).
    3. **Lighting & VFX:** (e.g., rim lighting, soft drop shadows, internal glow, refractive glass).
    
    The goal is to recreate a similar *vibe* for a different word. Provide the description in English. No other text.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text.trim();
};

const getStyleInstruction = (style: StyleOption): string => {
    switch (style) {
        case StyleOption.VECTOR:
            return "Style: Flat vector art, clean lines, minimal gradients, SVG illustration aesthetic.";
        case StyleOption.WATERCOLOR:
            return "Style: Artistic watercolor painting, soft washes, paper texture, paint splatter, blended colors.";
        case StyleOption.ILLUSTRATION:
            return "Style: High-quality digital illustration, vivid colors, clean composition, artistic shading.";
        case StyleOption.THREED_RENDER:
            return "Style: 3D centered render, Octane render, C4D, ray tracing, realistic materials, studio lighting.";
        case StyleOption.PIXEL_ART:
            return "Style: 8-bit pixel art, retro game aesthetic, sharp pixels, limited color palette.";
        case StyleOption.CUTE_PATTERN:
            return "Style: Cute seamless pattern aesthetic, pastel colors, kawaii motifs, soft rounded shapes.";
        case StyleOption.DREAMY_BOKEH:
            return "Style: Dreamy photography, heavy bokeh, soft focus, sparkling lights, ethereal atmosphere.";
        case StyleOption.VIBRANT_RAYS:
            return "Style: Vibrant energy, dynamic light rays, speed lines, glowing effects, high saturation.";
        case StyleOption.DEFAULT:
        default:
            return "Style: High-quality, professional, artistic, visually stunning composition.";
    }
};

const frameAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        structureDescription: { type: Type.STRING },
        shapeDescription: { type: Type.STRING },
        textElements: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    position: { type: Type.STRING },
                },
            },
        },
    },
    required: ["structureDescription", "shapeDescription", "textElements"],
};

const analyzeFrame = async (imageFile: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = "Analyze this image to identify the main decorative frame, border, or layout elements. Provide a detailed description of its structure and shape in English.";
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [imagePart, { text: prompt }] },
    });

    return response.text;
};

const buildFramePrompt = (
    theme: string,
    elements: string,
    color: string,
    background: BackgroundOption,
    negativePrompt: string,
    style: StyleOption,
    analysis: string,
    variationLevel: number,
    shapeStrategy: FrameShapeStrategy,
    hasStyleReference?: boolean,
    isBlankCanvas?: boolean
): string => {
    let centerInstruction: string;
    if (background === BackgroundOption.TRANSPARENT) {
        centerInstruction = `* **CENTER ZONE:** Fill with a **Light, Thematic Pattern/Texture** derived from "${theme}".
        - **NO SOLID COLOR:** Do not use a flat solid fill.
        - **PATTERN:** Generate a decorative pattern, texture, or scene element (e.g., faint wallpaper, light textured surface, subtle watermark pattern) inside the frame.
        - **VISIBILITY:** The pattern should be clearly visible (low transparency) but light in tone (pastel/high-key) to serve as a backdrop.`;
    } else if (background === BackgroundOption.BLACK) {
        centerInstruction = `* **CENTER ZONE:** Solid Black (#000000).`;
    } else { 
        centerInstruction = `* **CENTER ZONE:** Solid White (#FFFFFF).`;
    }

    let strategyInstruction = "";
    
    const forceOverwriteBlock = `
**STRATEGY: ADAPTIVE RECONSTRUCTION (FORCE OVERWRITE)**
1.  **INPUT MAPPING (CRITICAL):**
    - **Image 1 (Style Reference):** EXTRACT the Material, Texture, Lighting, and "Vibe". This is the **SKIN**.
    - **Image 2 (Layout Reference):** READ ONLY the Aspect Ratio and Canvas Dimensions. IGNORE the internal pixels/shapes. This is the **CANVAS SIZE**.
2.  **15% EDGE RULE:** Constrain ALL artistic elements, 3D decors, and textures to the **outer 15% margin**.
3.  **85% SAFE ZONE:** The central 85% area MUST remain empty (or filled with the Center Zone pattern defined above) and available for product display.
4.  **THEME FUSION:** The *Shape* of the frame elements is dictated by the Theme ("${theme}"). The *Material* of the elements is dictated by Image 1.`;

    if (isBlankCanvas) {
        strategyInstruction = `**Strategy: FRESH CREATION.** Based on the theme "${theme}", design a frame from scratch. The frame must adhere to the 15% EDGE RULE and 85% SAFE ZONE rule defined below. Constrain ALL artistic elements, 3D decors, and textures to the outer 15% margin. The central 85% must remain empty.`;
    } else {
        switch (shapeStrategy) {
            case 'original':
                if (hasStyleReference) {
                    strategyInstruction = `
**STRATEGY: ANALYTICAL STYLE TRANSFER ON PRESERVED SHAPE**
1.  **INPUT ANALYSIS (CRITICAL):**
    - **Image 1 (Style Reference):** Your role is to be an art director. **ANALYZE, DO NOT COPY.** Deconstruct this image to understand its "artistic DNA". Focus specifically on:
        - **SHAPES & FORMS:** Identify the dominant shapes, patterns, and structural elements (e.g., 'swirling vines', 'geometric crystals', 'soft cloud forms').
        - **MATERIAL & TEXTURE:** Determine the surface quality (e.g., 'brushed metal', 'glossy liquid', 'rough stone').
        - **COLOR PALETTE & LIGHTING:** Note the main colors and how light interacts with the surfaces.
    - **Image 2 (Shape Template):** This is the immutable architectural blueprint. Its overall structure and silhouette MUST be preserved.
2.  **TARGETED REDESIGN RULE:**
    - Identify the **non-white, decorative areas** of the Shape Template (Image 2). These are your canvas.
    - **RECREATE & SYNTHESIZE:** Your main task is to **fuse the SHAPES from Image 1 onto the STRUCTURE of Image 2**. Redesign the decorative areas of the template by building them out of the forms and patterns you analyzed from the style reference.
        - **Example:** If the Shape Template has a simple rectangular border, and the Style Reference contains twisting, thorny vines, you will render the border *as if it were made of those twisting, thorny vines*.
        - Apply the material, texture, and lighting from Image 1 to these newly formed shapes. This is a structural recreation, not a simple texture paste.
3.  **PRESERVATION RULE:**
    - The **white areas** of the Shape Template (Image 2) are a "no-paint zone". They MUST remain clean and match the 'CENTER ZONE' directive below.
4.  **EDGE BLENDING RULE (CRITICAL FOR AESTHETICS):**
    - The inner edge of the redesigned frame (where it meets the central white area) must **not be a hard, sharp line**.
    - Create a **natural, soft transition** into the center. This can be achieved through:
        - A subtle inner glow emanating from the frame.
        - Delicate, semi-transparent wisps or particles from the theme extending slightly inward.
        - A soft, feathered edge or a gentle shadow.
    - The goal is to make the frame feel organically integrated with the background, not like a harsh cutout.`;
                } else {
                    strategyInstruction = `**Strategy: STRICT PRESERVATION.** \n- Respect the Layout Reference structure found in Input Analysis.\n- Apply the Theme "${theme}" as a material/skin to the existing shapes.`;
                }
                break;
            case 'dynamic': 
            case 'creative': 
                strategyInstruction = hasStyleReference ? forceOverwriteBlock : `**Strategy: CREATIVE REIMAGINING.** Use Image 1 (Layout Reference) ONLY for its canvas dimensions. IGNORE its internal shapes. Based on the theme "${theme}", design a new frame from scratch. Adhere to the 15% EDGE RULE: constrain all artistic elements to the outer 15% margin, leaving the central 85% clear.`; 
                break;
        }
    }

    const colorInstruction = color 
        ? `**COLOR HIERARCHY (60/40 Rule):**
           - **60% DOMINANT:** "${color}" (Use for the main frame structure/body).
           - **40% AUXILIARY:** Theme-derived colors (Accents/Highlights).
           - ${hasStyleReference ? "Rule: Mix the material from Image 1 with this color palette." : ""}` 
        : `**Color:** Harmonious palette derived strictly from ${hasStyleReference ? 'Image 1 (Style Reference)' : 'the Theme'}.`;

    let inputDesc = "";
    if (hasStyleReference) {
        inputDesc = `
**INPUT IMAGES:**
1. **Image 1 (Style Reference):** The source of texture/material style.
2. **Image 2 (Layout Reference):** The source of canvas dimensions.`;
    } else if (!isBlankCanvas) {
         inputDesc = `
**INPUT IMAGES:**
1. **Image 1 (Layout Reference):** Use for dimensions. ${shapeStrategy !== 'original' ? 'IGNORE internal shapes.' : 'Preserve structure.'}`;
    }
    
    const analysisSection = (shapeStrategy === 'original' && analysis) ? `**Input Analysis:** ${analysis}\n` : "";

    return `**Role:** Senior E-commerce Visual Designer.
**Task:** Design a high-conversion product frame by mixing Style Ref + Layout Ref + Theme.
${inputDesc}
${analysisSection}
**DESIGN DIRECTIVES:**
1. **Theme:** "${theme}"
2. **Structure & Logic:** ${strategyInstruction}
3. **Color:** ${colorInstruction}
4. **Style:** ${getStyleInstruction(style)}
5. **Center:** ${centerInstruction}

**Negative Constraints:** ${negativePrompt}, messy center, clutter, low resolution, blurry, text, distorted, objects in center.
**Output:** Image only.`;
};

const buildPhotoPrompt = (theme: string, props: string, color: string, negativePrompt: string, style: StyleOption, productThemeLock: boolean, variationLevel: number, aspectRatio?: string): string => {
    let styleInstruction = getStyleInstruction(style);
    if (style === StyleOption.DEFAULT) styleInstruction = "Photorealistic, high-detail, realistic-style image.";

    if (productThemeLock) {
        return `**TASK: Background Replacement with Perfect Product Preservation.**
- Theme: "${theme}"
- Locked Subject: Preserve product perfectly.
- Color: ${color ? `Dominated by "${color}".` : 'Harmonious.'}
- Props: ${props}
- Style: ${styleInstruction}
- Output: Image only.`;
    } else {
        return `**TASK: Thematic Re-imagining.**
- Theme: "${theme}"
- Subject Identity: Preserve person's face identity perfectly.
- Variation Level: ${variationLevel}%
- Style: ${styleInstruction}
- Output: Image only.`;
    }
};

const buildBackgroundPrompt = (theme: string, color: string, negativePrompt: string, style: StyleOption, aspectRatio?: string): string => {
    // Optimized background prompt to prevent subject hallucinations and focus on texture/atmosphere
    return `**Task:** Generate a high-end product photography background (BACKDROP ONLY).
**Theme:** ${theme}
**Style:** ${getStyleInstruction(style)}
**Color Palette:** ${color ? `Dominant color: ${color}` : 'Harmonious and subtle'}

**CRITICAL COMPOSITION RULES:**
1. **Role:** This image is a BACKGROUND/STAGE for placing a product later. It must NOT contain a central subject.
2. **Composition:** Create a "stage" feel. Use depth of field (blur) for background elements. Keep the foreground/center clean or flat (Copy Space).
3. **Elements:** Abstract textures, soft lighting, podiums, nature elements, or architectural details. NO people, NO animals, NO text.
4. **Vibe:** Professional, Atmospheric, Clean.

**Output:** High-quality image only.`;
};

const buildButtonPrompt = (theme: string, elements: string, color: string, negativePrompt: string, style: StyleOption, background: BackgroundOption, material: ButtonMaterialOption): string => {
    return `Redesign the provided UI button. Theme: "${theme}". Material: ${material}. Color: ${color || 'Harmonious'}. Output only image.`;
};

const safelyExtractImageUrl = (response: GenerateContentResponse): string | null => {
    if (!response.candidates || response.candidates.length === 0) return null;
    const candidate = response.candidates[0];
    if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
};

interface GenerateImagesArgs {
    imageFile: File;
    theme: string;
    elements: string;
    props: string;
    color: string;
    background: BackgroundOption;
    negativePrompt: string;
    style: StyleOption;
    count: number;
    mode: GenerationMode;
    productThemeLock: boolean;
    elementMode?: GenerationParams['elementMode'];
    buttonMaterial?: GenerationParams['buttonMaterial'];
    frameMode?: GenerationParams['frameMode'];
    frameShapeStrategy?: FrameShapeStrategy;
    variationLevel: number;
    aspectRatio?: string;
    frameStyleSourceImageFile?: File;
    isBlankCanvas?: boolean;
}

export const generateImages = async ({
    imageFile,
    theme,
    elements,
    props,
    color,
    background,
    negativePrompt,
    style,
    count,
    mode,
    productThemeLock,
    elementMode,
    buttonMaterial,
    frameMode,
    frameShapeStrategy = 'dynamic',
    variationLevel,
    aspectRatio,
    frameStyleSourceImageFile,
    isBlankCanvas = false,
}: GenerateImagesArgs): Promise<string[]> => {
    let imageParts: any[]; 
    let prompt: string;

    if (mode === GenerationMode.ELEMENT && elementMode === 'button') {
        prompt = buildButtonPrompt(theme, elements, color, negativePrompt, style, background, buttonMaterial!);
        imageParts = [await fileToGenerativePart(imageFile)];
    } else if (mode === GenerationMode.FRAME) {
        const hasStyleReference = !!frameStyleSourceImageFile;
        // CRITICAL: Ensure correct order. Style first, Layout second.
        // If hasStyleReference, array becomes [StyleImage, LayoutImage]
        imageParts = [await fileToGenerativePart(imageFile)]; // Layout Image
        if (hasStyleReference) {
            // FIX: Corrected variable name from frameStyleSourceImage to frameStyleSourceImageFile
            imageParts.unshift(await fileToGenerativePart(frameStyleSourceImageFile!)); // Style Image
        }
        
        let analysisResult = "";
        // Optimization: Only analyze structure if we intend to preserve it ('original' strategy).
        // For Force Overwrite (dynamic/creative), skip analysis to avoid biasing the model.
        if (!isBlankCanvas && frameShapeStrategy === 'original') {
             analysisResult = await analyzeFrame(imageFile);
        }
        
        prompt = buildFramePrompt(theme, elements, color, background, negativePrompt, style, analysisResult, variationLevel, frameShapeStrategy, hasStyleReference, isBlankCanvas);
    } else if (mode === GenerationMode.BACKGROUND) {
        prompt = buildBackgroundPrompt(theme, color, negativePrompt, style, aspectRatio);
        imageParts = [await fileToGenerativePart(imageFile)];
    } else { 
        imageParts = [await fileToGenerativePart(imageFile)];
        prompt = buildPhotoPrompt(theme, props, color, negativePrompt, style, productThemeLock, variationLevel, aspectRatio);
    }
    
    const textPart = { text: prompt };
    const model = 'gemini-2.5-flash-image';
    const imageUrls: string[] = [];

    for (let i = 0; i < count; i++) {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [...imageParts, textPart] },
            config: { seed: Math.floor(Math.random() * 1000000), ...(aspectRatio && aspectRatio !== 'source' ? { imageConfig: { aspectRatio: aspectRatio } } : {}) },
        });
        const url = safelyExtractImageUrl(response);
        if (url) imageUrls.push(url);
    }

    if (imageUrls.length === 0) throw new Error("AI未能生成图像。");
    return imageUrls;
};

const processImageModification = async (imageFile: File, prompt: string): Promise<string> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
    });
    const imageUrl = safelyExtractImageUrl(response);
    if (imageUrl) return imageUrl;
    throw new Error(`AI未能生成图像。`);
};

export const removeTextFromImage = async (imageFile: File): Promise<string> => {
    return processImageModification(imageFile, `Task: Perfectly remove all text from the image. Reconstruct background.`);
};

export const upscaleImage = async (imageFile: File): Promise<string> => {
    return processImageModification(imageFile, `Task: Upscale image to double resolution.`);
};

export const sharpenImage = async (imageFile: File): Promise<string> => {
    return processImageModification(imageFile, `Task: Sharpen image details.`);
};

export const modifyImage = async (imageFile: File, modificationPrompt: string): Promise<string> => {
    return processImageModification(imageFile, `Task: Modify image: "${modificationPrompt}".`);
};

export const modifyTextInImage = async (imageFile: File, newText: string): Promise<string> => {
    return processImageModification(imageFile, `Task: Replace text with "${newText}". Match original style.`);
};

export const restyleTextInImage = async (
    imageFile: File,
    theme: string,
    color: string,
    style: StyleOption,
    negativePrompt: string
): Promise<string> => {
    const styleInstruction = getStyleInstruction(style);
    let prompt = `Task: Redesign text style based on theme: "${theme}". Keep wording and position. New style: ${styleInstruction}. ${color ? `Color: "${color}".` : ''} Output image only.`;
    return processImageModification(imageFile, prompt);
};

const getFontBackgroundInstruction = (background: BackgroundOption): string => {
    switch (background) {
        case BackgroundOption.WHITE: return "The background MUST be PURE SOLID WHITE (#FFFFFF). NO shadows casting on the background. NO gradients. NO patterns.";
        case BackgroundOption.BLACK: return "The background MUST be PURE SOLID BLACK (#000000). NO stars. NO gradients. NO patterns.";
        case BackgroundOption.TRANSPARENT:
        default: return "The background MUST be a single, flat, solid color (like pure white) suitable for easy background removal. NO texture in background.";
    }
};

const buildFontPrompt = (
    text: string,
    expandedTheme: string,
    color: string,
    style: StyleOption,
    background: BackgroundOption,
    intensity: number,
    styleAnalysis?: string
): string => {
    const backgroundInstruction = getFontBackgroundInstruction(background);
    const styleInstruction = getStyleInstruction(style);
    
    const colorInstruction = color
        ? `* **Color Palette:** Use color "${color}" as dominant anchor.`
        : `* **Color Palette:** Harmonious based on theme.`;

    const analysisInstruction = styleAnalysis 
        ? `\n**STYLE REFERENCE ANALYSIS:**\n${styleAnalysis}\nConstraint: Use the font style/material from the reference, but IGNORE the reference image's background/scenery.`
        : '';

    // Intensity control logic
    let intensityGuidance = "";
    if (intensity < 30) {
        intensityGuidance = "CRITICAL: Minimalist approach. Very clean, legible typography. Extremely subtle decoration. No over-the-top 3D or ornate textures. Focus on professional simplicity.";
    } else if (intensity < 70) {
        intensityGuidance = "Balanced artistic approach. Moderate 3D effects and textures. Artistic but remains clearly legible.";
    } else {
        intensityGuidance = "Maximum artistic expression. Highly ornate, extravagant 3D effects, complex textures, rich atmospheric lighting, and dramatic visual impact.";
    }

    return `**Role:** Elite Typography Artist.
**Task:** Create a stunning typography design for the word "${text}".
**Design Brief (Context):** ${expandedTheme}

**EXECUTION PLAN:**
1. **Font Selection:** Use the [Font Topology] recommended in the Design Brief above. This is critical for matching the theme.
2. **Material:** Apply the [Material & Texture] from the Design Brief to the letters themselves.
3. **Surrounding Decoration:** Scatter **exactly 6-7 small decorative elements** (from the Design Brief) floating AROUND the text.
   - **Constraint:** These elements must be distinct and floating nearby.
   - **Constraint:** Elements must NOT form a background scene. They must be floating props.
   - **Constraint:** Do NOT obscure the text. The text must remain 100% legible.
4. **Style:** ${styleInstruction}
5. **Color:** ${colorInstruction}
6. **Background:** ${backgroundInstruction}
7. **Intensity:** ${intensityGuidance}

${analysisInstruction}

**Negative Constraints:** complex background, scenery, landscape, room, wall, table, photo frame, realistic environment, messy details, misspelled text, extra words, blurry, background clutter.
**Output:** A single high-quality image of the text.`;
};

export const createBlankCanvasFile = (aspectRatio: string, color: string = '#FFFFFF'): Promise<File> => {
    return new Promise((resolve, reject) => {
        const [w, h] = aspectRatio.split(':').map(Number);
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = Math.round(1024 * (h / w));
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => blob ? resolve(new File([blob], 'canvas.png', { type: 'image/png' })) : reject(new Error('Blob failed')), 'image/png');
    });
};

export const generateFontImages = async (
    text: string,
    theme: string,
    color: string,
    style: StyleOption,
    negativePrompt: string,
    count: number,
    background: BackgroundOption,
    fontMode: GenerationParams['fontMode'],
    intensity: number,
    material?: ButtonMaterialOption,
    aspectRatio?: string,
    styleReferenceImageFile?: File
): Promise<string[]> => {
    let expandedTheme = theme;
    if (theme.trim()) {
        try {
            expandedTheme = await expandThemePrompt(theme, GenerationMode.FONT);
        } catch (e) { console.error(e); }
    }

    let styleAnalysis = "";
    if (styleReferenceImageFile) {
        try {
            styleAnalysis = await analyzeFontStyleFromImage(styleReferenceImageFile);
        } catch (e) { console.error("Style analysis failed", e); }
    }

    const canvasColor = background === BackgroundOption.BLACK ? '#000000' : '#FFFFFF';
    const prompt = fontMode === 'bubble'
        ? `Task: Create text "${text}" inside a theme-based bubble. Theme: ${expandedTheme}. Style: ${getStyleInstruction(style)}. ${getFontBackgroundInstruction(background)}. Output image only.`
        : buildFontPrompt(text, expandedTheme, color, style, background, intensity, styleAnalysis);
        
    const canvasFile = await createBlankCanvasFile(aspectRatio || '16:9', canvasColor);
    const imageParts = [await fileToGenerativePart(canvasFile)];
    if (styleReferenceImageFile) imageParts.push(await fileToGenerativePart(styleReferenceImageFile));
    
    const imageUrls: string[] = [];
    for (let i = 0; i < count; i++) {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [...imageParts, { text: prompt }] },
            config: { seed: Math.floor(Math.random() * 1000000), ...(aspectRatio && aspectRatio !== 'source' ? { imageConfig: { aspectRatio: aspectRatio } } : {}) },
        });
        const url = safelyExtractImageUrl(response);
        if (url) imageUrls.push(url);
    }
    return imageUrls;
};

export const generateElementImages = async (
    theme: string,
    color: string,
    style: StyleOption,
    negativePrompt: string,
    count: number,
    material: ButtonMaterialOption
): Promise<string[]> => {
    const prompt = `Task: Create sticker sheet for theme: "${theme}". Style: ${getStyleInstruction(style)}. Color: ${color || 'Harmonious'}. Output image only.`;
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: count, outputMimeType: 'image/png', aspectRatio: '1:1' },
    });
    return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
};

export const extractElementsFromImage = async (imageFile: File, count: number): Promise<string[]> => {
    const imagePart = await fileToGenerativePart(imageFile);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, { text: `Extract elements and arrange in grid on white background. Output image only.` }] },
    });
    return [safelyExtractImageUrl(response)!].filter(Boolean);
};

export const restyleFrame = async (aestheticSourceImage: File, structuralSourceImage: File, variationLevel: number, background: BackgroundOption): Promise<string> => {
    const analysisResult = await analyzeFrame(structuralSourceImage);
    const prompt = buildFramePrompt("", "", "", background, "", StyleOption.DEFAULT, analysisResult, variationLevel, 'original', true, false);
    const aestheticImagePart = await fileToGenerativePart(aestheticSourceImage);
    const structuralImagePart = await fileToGenerativePart(structuralSourceImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [aestheticImagePart, structuralImagePart, { text: prompt }] },
    });
    return safelyExtractImageUrl(response)!;
};

export const restyleBubbleFrame = async (aestheticSourceImage: File, structuralSourceImage: File, variationLevel: number, background: BackgroundOption, style: StyleOption): Promise<string> => {
    const analysisResult = await analyzeFrame(structuralSourceImage);
    const prompt = buildFramePrompt("", "", "", background, "", style, analysisResult, variationLevel, 'original', true, false);
    const aestheticImagePart = await fileToGenerativePart(aestheticSourceImage);
    const structuralImagePart = await fileToGenerativePart(structuralSourceImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [aestheticImagePart, structuralImagePart, { text: prompt }] },
    });
    return safelyExtractImageUrl(response)!;
};

export const restyleButton = async (styleSourceImage: File, shapeSourceImage: File, background: BackgroundOption): Promise<string> => {
    const styleImagePart = await fileToGenerativePart(styleSourceImage);
    const shapeImagePart = await fileToGenerativePart(shapeSourceImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [styleImagePart, shapeImagePart, { text: `UI Style Transfer. Material from Img1, Shape from Img2. Output image only.` }] },
    });
    return safelyExtractImageUrl(response)!;
};
