import { File } from "buffer";
import { createClient } from "@supabase/supabase-js";
import { ConfigService } from "@nestjs/config";

export const fileUpload = async (file: Express.Multer.File, bucket: string) => {
    const configService = new ConfigService();
    const supabase = createClient(configService.get<string>('SUPABASE_URL'), configService.get<string>('SUPABASE_KEY'));
    const storage = supabase.storage.from(bucket);
    const newFile = new File([file.buffer], file.originalname, { type: file.mimetype });
    const fileName = file.originalname.split('.').join(`_${new Date().getTime()}.`);
    const { data, error } = await storage.upload(`${fileName}`, newFile, {
        cacheControl: '3600',
        upsert: false,
    });
    if (error) {
        console.log(error);
        throw error;
    }
    const publicUrlData = storage.getPublicUrl(fileName);
    return publicUrlData.data.publicUrl;
}

