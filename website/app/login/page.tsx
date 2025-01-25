"use client";

import "react-toastify/dist/ReactToastify.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSession, displaySession } from "../actions";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PDFDocument } from "pdf-lib";
import { toast, ToastContainer } from "react-toastify";
import { useForm, FieldErrors } from "react-hook-form";
import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  email: z.string().email("Email must be a valid email"),
  session: z.string().min(1, "Please select a session"),
});

export type FormValues = z.infer<typeof formSchema>;

export default function RegisterForm() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      session: "",
    },
  });

  const handleErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      toast.error(`Error: ${error.message}`, { position: "top-center" });
    } else {
      toast.error("An unknown error occurred.", { position: "top-center" });
    }
  };

  const createTicket = useCallback(async (qrCode: string) => {
    try {
      const values = form.getValues();
      const pdfPath = `/pdf/${values.session.substring(0, 3)}.pdf`;
      const existingPdfBytes = await fetch(pdfPath).then((res) => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const qrCodeImage = await pdfDoc.embedPng(qrCode);
      const qrCodeDims = qrCodeImage.scale(0.5);

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      firstPage.drawImage(qrCodeImage, {
        x: (firstPage.getWidth() - qrCodeDims.width * 6) / 2,
        y: (firstPage.getHeight() - qrCodeDims.height * 6) / 2,
        width: qrCodeDims.width * 6,
        height: qrCodeDims.height * 6,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });

      const newTab = window.open();
      if (newTab) {
        const objectURL = URL.createObjectURL(blob);
        newTab.location.href = objectURL;
      }

      toast.success("Registration successful! Ticket generated.", {
        position: "top-center",
      });
    } catch (error) {
      handleErrorMessage(error);
    }
  }, [form]);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    handleResize();

    // Add event listener for resize
    window.addEventListener('resize', handleResize);

    // Clean up event listener on component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (qrCode) {
      createTicket(qrCode);
    }
  }, [qrCode, createTicket]);

  const onSubmit = async (values: FormValues) => {
    setQrCode(null);
    setLoading(true);
    try {
      const qrCodeUrl = await displaySession(values.email, values.session);
      const result = qrCodeUrl.split(/\s*:\s*/);

      if (result[0] == "ERROR") throw Error(result[1]);
      else setQrCode(qrCodeUrl);

    } catch (error) {
      handleErrorMessage(error);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (errors: FieldErrors<FormValues>) => {
    Object.values(errors).forEach((error) => {
      if (error?.message) {
        toast.error(error.message, {
          position: "top-center",
        });
      }
    });
  };

  return (
    <main className="flex flex-col min-h-screen justify-between bg-cover bg-center bg-no-repeat bg-[url('/img/background.png')]">
      <div className="w-full">
        <img
          src={isMobile ? "/img/header/header_mobile.png" : "/img/header/header_web.png"}
          alt="Header"
          className="w-full object-cover"
        />
      </div>

      <div className="mx-auto max-w-sm mt-8 mb-4 px-8">
        <img src="/img/register_here.png" alt="Register Here" className="w-full object-cover" />
      </div>

      <div className="flex justify-center items-center flex-grow">
        <Card className="mx-auto max-w-sm bg-transparent shadow-none border-none">
          <CardContent>
            <div className="grid gap-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, handleError)}>
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-yellow-600 font-bold" style={{ fontFamily: 'Times New Roman, serif' }}>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-2">
                    <FormField
                      control={form.control}
                      name="session"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-yellow-600 font-bold" style={{ fontFamily: 'Times New Roman, serif' }}>Session</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="w-full p-2 border rounded-md"
                              value={field.value || ""}
                              aria-label="Select session"
                            >
                              <option value="" disabled hidden>
                                Please select a session
                              </option>
                              <option value="Friday, January 24th, 2025" style={{ fontFamily: 'Times New Roman, serif' }}>Friday, January 24th, 2025</option>
                              <option value="Saturday, January 25th, 2025" style={{ fontFamily: 'Times New Roman, serif' }}>Saturday, January 25th, 2025</option>
                              <option value="Sunday, January 26th, 2025" style={{ fontFamily: 'Times New Roman, serif' }}>Sunday, January 26th, 2025</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-4 mb-4">
                    <Button
                      type="submit"
                      className="w-full bg-yellow-600 text-white font-bold py-2 rounded-md hover:bg-yellow-600"
                      disabled={loading} style={{ fontFamily: 'Times New Roman, serif' }}
                    >
                      {loading ? "Loading..." : "Login"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
            {qrCode && (
              <div className="hidden">
                <img id="qr-code" src={qrCode} alt="QR Code" className="w-48 h-48 mb-4" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <img
          src={isMobile ? "/img/footer/footer_mobile.png" : "/img/footer/footer_web.png"}
          alt="Footer"
          className="w-full object-cover"
        />
      </div>

      <ToastContainer />
    </main>
  );
}
