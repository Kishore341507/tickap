"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight,
  MessageSquare,
  Calendar,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Globe,
  Send,
  Loader2
} from "lucide-react";

export default function Services() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send message to Discord webhook
      const webhookUrl = "https://discord.com/api/webhooks/1370791634924605510/GJ__nPdDkWn_rynQOwZChbt5b79eMCud1y40OOgwF1P1y6wvwxoAkTkV4aOlyUAr_dpz";
      
      const payload = {
        embeds: [
          {
            title: "New Contact Form Submission",
            color: 0x9C59B6, // Purple color
            fields: [
              {
                name: "Name",
                value: formData.name,
                inline: true
              },
              {
                name: "Email",
                value: formData.email,
                inline: true
              },
              {
                name: "Message",
                value: formData.message
              }
            ],
            timestamp: new Date().toISOString(),
            footer: {
              text: "Tickap Contact Form"
            }
          }
        ]
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to send message to Discord");
      }

      // Show success toast
      toast({
        title: "Success",
        description: "Your message has been sent successfully!",
        variant: "success",
      });

      // Reset form fields
      setFormData({
        name: "",
        email: "",
        message: ""
      });
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black">
      {/* Hero Section with Animated Background */}
      <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden bg-gradient-to-br from-black via-gray-900 to-purple-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                width: `${Math.random() * 300 + 50}px`,
                height: `${Math.random() * 300 + 50}px`,
                background: `radial-gradient(circle, rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.8) 0%, rgba(0,0,0,0) 70%)`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${Math.random() * 10 + 10}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="w-full md:w-1/2 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-300">
                <span className="block">Powering Your Events</span>
                <span className="block text-5xl md:text-7xl mt-2 pb-2">& Digital Presence</span>
              </h1>
              <p className="text-gray-300 text-xl mb-8 max-w-lg">
                From seamless event management to custom websites for brands — plus powerful Discord and WhatsApp bots, we help you engage, automate, and stand out.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 rounded-full">
                  <Link href="#services">
                    Explore Our Services <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-transparent border-2 border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-full">
                  <Link href="/event">
                    Event Platform <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="w-full md:w-1/2 relative">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-20 blur-3xl animate-pulse" />
                <div className="relative z-10 h-full flex items-center justify-center">
                  <Image
                    src="/tickap_dark.svg"
                    alt="Tickap Logo"
                    width={300}
                    height={300}
                    className="animate-float"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-scroll" />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Our Products & Services</h2>
            <p className="text-gray-300">
              From our flagship event management platform to custom web and bot development services, we have everything you need to succeed in the digital world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Event Platform Card */}
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-green-600 text-white text-xs font-bold py-1 px-2 rounded-full">
                Our Product
              </div>
              <CardContent className="p-8 flex flex-col h-full">
                <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl mb-6 p-4 shadow-lg">
                  <Calendar className="h-full w-full text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Event Platform</h3>
                <p className="text-gray-300 mb-6 flex-grow">
                  Our flagship product - a comprehensive event management platform for planning, organizing, and hosting successful events.
                </p>
                <ul className="space-y-3 mb-6 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    <span>Registration & ticketing</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    <span>Event promotions</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    <span>Integrated With Discord</span>
                  </li>
                </ul>
                <Button asChild className="mt-auto bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white">
                  <Link href="/event">
                    Go to Event Platform <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Web Development Card */}
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded-full">
                Service
              </div>
              <CardContent className="p-8 flex flex-col h-full">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-6 p-4 shadow-lg">
                  <Globe className="h-full w-full text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Web Development</h3>
                <p className="text-gray-300 mb-6 flex-grow">
                  Custom websites built for performance and user experience. From simple landing pages to complex web applications.
                </p>
                <ul className="space-y-3 mb-6 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-500" />
                    <span>Responsive design</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-500" />
                    <span>SEO optimization</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-500" />
                    <span>E-commerce solutions</span>
                  </li>
                </ul>
                <Button variant="outline" asChild className="mt-auto bg-transparent border-blue-500 text-blue-500 hover:bg-blue-900/20 hover:text-blue-400 group-hover:border-blue-400 transition-all duration-300">
                  <a href="#contact">
                    Request a Quote <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Bot Development Card */}
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold py-1 px-2 rounded-full">
                Service
              </div>
              <CardContent className="p-8 flex flex-col h-full">
                <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl mb-6 p-4 shadow-lg">
                  <MessageSquare className="h-full w-full text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Bot Development</h3>
                <p className="text-gray-300 mb-6 flex-grow">
                  Powerful Discord and WhatsApp bots for customer engagement, automation, and business growth.
                </p>
                <ul className="space-y-3 mb-6 text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-purple-500" />
                    <span>Customer support automation</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-purple-500" />
                    <span>Custom commands & workflows</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-purple-500" />
                    <span>Integration with your systems</span>
                  </li>
                </ul>
                <Button variant="outline" asChild className="mt-auto bg-transparent border-purple-500 text-purple-500 hover:bg-purple-900/20 hover:text-purple-400 group-hover:border-purple-400 transition-all duration-300">
                  <a href="#contact">
                    Request a Quote <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">What Our Clients Say</h2>
            <p className="text-gray-300">
              Don&apos;t just take our word for it, hear from our satisfied clients about their experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl relative">
              <div className="absolute -top-5 -left-5 w-10 h-10 text-5xl text-purple-500 opacity-50">&quot;</div>
              <p className="text-gray-300 mb-6 relative z-10">
                Tickap built us an incredible Discord bot that has revolutionized how we interact with our community. The automation features have saved us countless hours.
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mr-4"></div>
                <div>
                  <h4 className="font-bold text-white">naruto_d</h4>
                  <p className="text-gray-400 text-sm">Community Admin, AUI (Discord)</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl relative">
              <div className="absolute -top-5 -left-5 w-10 h-10 text-5xl text-blue-500 opacity-50">&quot;</div>
              <p className="text-gray-300 mb-6 relative z-10">
                The website Tickap developed for our business exceeded our expectations. It&apos;s beautiful, functional, and has significantly increased our online conversions.
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-500 mr-4"></div>
                <div>
                  <h4 className="font-bold text-white">Hitank</h4>
                  <p className="text-gray-400 text-sm">Content Manager</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            {/* <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-xl relative">
              <div className="absolute -top-5 -left-5 w-10 h-10 text-5xl text-green-500 opacity-50">&quot;</div>
              <p className="text-gray-300 mb-6 relative z-10">
                Tickap&apos;s event platform made organizing our conference a breeze. The registration system, attendee management, and analytics tools are top-notch.
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 mr-4"></div>
                <div>
                  <h4 className="font-bold text-white">Jennifer Lee</h4>
                  <p className="text-gray-400 text-sm">Event Coordinator, TechConf</p>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Get In Touch</h2>
              <p className="text-gray-300 mb-8">
                Have a project in mind? Need a custom solution? Fill out the form and we&apos;ll get back to you as soon as possible.
              </p>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white">
                      <a href="mailto:contact@tickap.com" target="_blank" rel="noopener noreferrer">
                        contact@tickap.com
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Website</p>
                    <p className="text-white">
                      <a href="https://tickap.com" target="_blank" rel="noopener noreferrer">
                        tickap.com
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Discord</p>
                    <p className="text-white">
                      <a href="https://discord.gg/pkVxQU2ae9" target="_blank" rel="noopener noreferrer">
                        discord.gg/pkVxQU2ae9
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>            <div className="bg-gray-800/50 p-8 rounded-2xl backdrop-blur-sm border border-gray-700 shadow-lg">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    required
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Your Message"
                    required
                    className="min-h-[120px] bg-white/5 border-white/10 text-white"
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <Image src="/tickap_dark.svg" alt="Tickap Logo" width={40} height={40} className="mr-3" />
                <span className="text-xl font-bold text-white">Tickap</span>
              </div>
              <p className="mb-6">
                Innovative digital solutions for businesses of all sizes, from web development to custom bots and event management.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://github.com/kishore341507" className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Services</h3>
              <ul className="space-y-3">
                <li><a href="#services" className="hover:text-blue-400 transition-colors">Web Development</a></li>
                <li><a href="#services" className="hover:text-blue-400 transition-colors">Bot Development</a></li>
                <li><a href="/event" className="hover:text-blue-400 transition-colors">Event Platform</a></li>
                <li><a href="#contact" className="hover:text-blue-400 transition-colors">Custom Solutions</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-3">
                <li><a href="/event/aboutus" className="hover:text-blue-400 transition-colors">About Us</a></li>
                {/* <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
                <li><a href="/event/privacy-policy" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                <li><a href="/event/terms-and-conditions" className="hover:text-blue-400 transition-colors">Terms of Service</a></li> */}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Newsletter</h3>
              <p className="mb-4">Subscribe to get updates on our services and special offers</p>
              <form className="flex">
                <Input
                  type="email"
                  placeholder="Will Open Soon"
                  className="bg-white/5 border-white/10 text-white rounded-r-none"
                  disabled
                />
                <Button type="submit" disabled className="bg-blue-600 hover:bg-blue-700 rounded-l-none">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} Tickap. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes scroll {
          0% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(6px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-scroll {
          animation: scroll 1.5s infinite;
        }
      `}</style>
    </div>
  );
}